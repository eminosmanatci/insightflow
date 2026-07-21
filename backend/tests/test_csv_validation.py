import pytest

from app.pipeline.validation import (
    CSVValidationError,
    validate_sales_csv,
)


VALID_CSV = b"""date,region,category,customer,product,quantity,price,total
2026-01-10,Marmara,Elektronik,Ahmet,Laptop,1,20000,20000
2026-01-11,Ege,Giyim,Ayse,Kaban,2,1500,3000
"""


def test_valid_sales_csv():
    dataframe = validate_sales_csv(VALID_CSV)

    assert len(dataframe) == 2
    assert dataframe.iloc[0]["region"] == "Marmara"
    assert dataframe.iloc[0]["quantity"] == 1
    assert dataframe.iloc[0]["price"] == 20000


def test_missing_required_column_is_rejected():
    csv_data = b"""date,region,quantity,price,total
2026-01-10,Marmara,1,100,100
"""

    with pytest.raises(
        CSVValidationError,
        match="Eksik zorunlu kolonlar",
    ):
        validate_sales_csv(csv_data)


def test_invalid_date_is_rejected():
    csv_data = VALID_CSV.replace(
        b"2026-01-10",
        b"32/54/2026",
    )

    with pytest.raises(
        CSVValidationError,
        match="Gecersiz tarih|Geçersiz tarih",
    ):
        validate_sales_csv(csv_data)


@pytest.mark.parametrize(
    "old_value,new_value",
    [
        (b",1,20000,20000", b",abc,20000,20000"),
        (b",1,20000,20000", b",0,20000,20000"),
        (b",1,20000,20000", b",1.5,20000,20000"),
    ],
)
def test_invalid_quantity_is_rejected(
    old_value,
    new_value,
):
    csv_data = VALID_CSV.replace(
        old_value,
        new_value,
        1,
    )

    with pytest.raises(
        CSVValidationError,
        match="quantity",
    ):
        validate_sales_csv(csv_data)


@pytest.mark.parametrize(
    "old_value,new_value",
    [
        (b",20000,20000", b",abc,20000"),
        (b",20000,20000", b",-1,20000"),
        (b",20000,20000", b",20000,-1"),
    ],
)
def test_invalid_money_value_is_rejected(
    old_value,
    new_value,
):
    csv_data = VALID_CSV.replace(
        old_value,
        new_value,
        1,
    )

    with pytest.raises(CSVValidationError):
        validate_sales_csv(csv_data)


def test_empty_text_field_is_rejected():
    csv_data = VALID_CSV.replace(
        b"Marmara",
        b" ",
        1,
    )

    with pytest.raises(
        CSVValidationError,
        match="region",
    ):
        validate_sales_csv(csv_data)


def test_duplicate_sales_rows_are_rejected():
    duplicate_csv = VALID_CSV + (
        b"2026-01-10,Marmara,Elektronik,"
        b"Ahmet,Laptop,1,20000,20000\n"
    )

    with pytest.raises(
        CSVValidationError,
        match="Tekrarlanan",
    ):
        validate_sales_csv(duplicate_csv)


def test_duplicate_normalized_columns_are_rejected():
    csv_data = b"""date,region,Region ,category,customer,product,quantity,price,total
2026-01-10,Marmara,Ege,Elektronik,Ahmet,Laptop,1,20000,20000
"""

    with pytest.raises(
        CSVValidationError,
        match="Tekrarlanan kolonlar",
    ):
        validate_sales_csv(csv_data)


def test_utf8_bom_is_supported():
    csv_data = b"\xef\xbb\xbf" + VALID_CSV

    dataframe = validate_sales_csv(csv_data)

    assert len(dataframe) == 2