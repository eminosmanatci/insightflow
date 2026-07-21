from datetime import datetime

from app.core.security import create_access_token
from app.models.dataset import Dataset, SalesRecord
from app.models.organization import Organization
from app.models.user import User


def create_analytics_scenario(db_session):
    organization = Organization(
        name="Analytics Organization",
    )
    other_organization = Organization(
        name="Other Organization",
    )
    db_session.add_all(
        [
            organization,
            other_organization,
        ]
    )
    db_session.flush()

    user = User(
        email="analyst@example.com",
        hashed_password="unused",
        full_name="Analytics User",
        role="admin",
        is_active=True,
        organization_id=organization.id,
    )
    db_session.add(user)
    db_session.flush()

    dataset = Dataset(
        name="analytics.csv",
        status="completed",
        organization_id=organization.id,
        file_hash="analytics-hash",
    )
    other_dataset = Dataset(
        name="other.csv",
        status="completed",
        organization_id=other_organization.id,
        file_hash="other-hash",
    )
    db_session.add_all(
        [
            dataset,
            other_dataset,
        ]
    )
    db_session.flush()

    db_session.add_all(
        [
            SalesRecord(
                dataset_id=dataset.id,
                organization_id=organization.id,
                transaction_date=datetime(
                    2026, 1, 10
                ),
                region="Marmara",
                category="Elektronik",
                customer_name="Customer A",
                product_name="Laptop",
                quantity=1,
                unit_price=100,
                total_price=100,
            ),
            SalesRecord(
                dataset_id=dataset.id,
                organization_id=organization.id,
                transaction_date=datetime(
                    2026, 1, 20
                ),
                region="Ege",
                category="Ofis",
                customer_name="Customer B",
                product_name="Masa",
                quantity=1,
                unit_price=200,
                total_price=200,
            ),
            SalesRecord(
                dataset_id=dataset.id,
                organization_id=organization.id,
                transaction_date=datetime(
                    2026, 2, 5
                ),
                region="Marmara",
                category="Elektronik",
                customer_name="Customer C",
                product_name="Monitor",
                quantity=1,
                unit_price=300,
                total_price=300,
            ),
            SalesRecord(
                dataset_id=other_dataset.id,
                organization_id=other_organization.id,
                transaction_date=datetime(
                    2026, 1, 15
                ),
                region="Marmara",
                category="Other",
                customer_name="Other Customer",
                product_name="Other Product",
                quantity=1,
                unit_price=9999,
                total_price=9999,
            ),
        ]
    )
    db_session.commit()

    token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role,
        }
    )

    return {
        "Authorization": f"Bearer {token}",
    }


def test_kpis_use_transaction_terminology(
    client,
    db_session,
):
    headers = create_analytics_scenario(
        db_session
    )

    response = client.get(
        "/analytics/kpis",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == {
        "total_revenue": 600.0,
        "transaction_count": 3,
        "average_transaction_value": 200.0,
    }


def test_kpis_apply_inclusive_date_filter(
    client,
    db_session,
):
    headers = create_analytics_scenario(
        db_session
    )

    response = client.get(
        (
            "/analytics/kpis"
            "?date_from=2026-01-01"
            "&date_to=2026-01-31"
        ),
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == {
        "total_revenue": 300.0,
        "transaction_count": 2,
        "average_transaction_value": 150.0,
    }


def test_analytics_rejects_invalid_date_range(
    client,
    db_session,
):
    headers = create_analytics_scenario(
        db_session
    )

    response = client.get(
        (
            "/analytics/kpis"
            "?date_from=2026-02-01"
            "&date_to=2026-01-01"
        ),
        headers=headers,
    )

    assert response.status_code == 422


def test_region_analytics_enforces_tenant_scope(
    client,
    db_session,
):
    headers = create_analytics_scenario(
        db_session
    )

    response = client.get(
        "/analytics/regions",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "region": "Marmara",
            "total_revenue": 400.0,
        },
        {
            "region": "Ege",
            "total_revenue": 200.0,
        },
    ]

def test_monthly_revenue_returns_chronological_trend(
    client,
    db_session,
):
    headers = create_analytics_scenario(
        db_session
    )

    response = client.get(
        "/analytics/monthly",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "month": "2026-01",
            "total_revenue": 300.0,
            "transaction_count": 2,
        },
        {
            "month": "2026-02",
            "total_revenue": 300.0,
            "transaction_count": 1,
        },
    ]

def test_category_revenue_is_ordered_by_revenue(
    client,
    db_session,
):
    headers = create_analytics_scenario(
        db_session
    )

    response = client.get(
        "/analytics/categories",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "category": "Elektronik",
            "total_revenue": 400.0,
            "transaction_count": 2,
        },
        {
            "category": "Ofis",
            "total_revenue": 200.0,
            "transaction_count": 1,
        },
    ]

def test_product_performance_respects_limit(
    client,
    db_session,
):
    headers = create_analytics_scenario(
        db_session
    )

    response = client.get(
        "/analytics/products?limit=2",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "product_name": "Monitor",
            "total_revenue": 300.0,
            "quantity_sold": 1,
        },
        {
            "product_name": "Masa",
            "total_revenue": 200.0,
            "quantity_sold": 1,
        },
    ]

def test_customer_revenue_excludes_other_tenants(
    client,
    db_session,
):
    headers = create_analytics_scenario(
        db_session
    )

    response = client.get(
        "/analytics/customers",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "customer_name": "Customer C",
            "total_revenue": 300.0,
            "transaction_count": 1,
        },
        {
            "customer_name": "Customer B",
            "total_revenue": 200.0,
            "transaction_count": 1,
        },
        {
            "customer_name": "Customer A",
            "total_revenue": 100.0,
            "transaction_count": 1,
        },
    ] 