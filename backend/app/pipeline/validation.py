import csv
import io

import pandas as pd


REQUIRED_COLUMNS = (
    "date",
    "region",
    "category",
    "customer",
    "product",
    "quantity",
    "price",
    "total",
)

TEXT_COLUMNS = (
    "region",
    "category",
    "customer",
    "product",
)


class CSVValidationError(ValueError):
    """CSV veri sözleşmesine uymayan dosyalar için hata."""

    def __init__(
        self,
        errors: list[str],
        total_rows: int = 0,
        invalid_rows: int = 0,
    ):
        self.errors = errors
        self.total_rows = total_rows
        self.invalid_rows = invalid_rows

        super().__init__("; ".join(errors))


def normalize_column_name(column_name: str) -> str:
    """Kolon adını standart snake_case biçimine getirir."""
    return "_".join(
        column_name.strip().lower().split()
    )


def _decode_csv(file_contents: bytes) -> str:
    if not file_contents:
        raise CSVValidationError(
            ["CSV dosyası boş olamaz."]
        )

    try:
        return file_contents.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise CSVValidationError(
            ["CSV dosyası UTF-8 formatında olmalıdır."]
        ) from exc


def _validate_header(csv_text: str) -> list[str]:
    try:
        header = next(csv.reader(io.StringIO(csv_text)))
    except StopIteration as exc:
        raise CSVValidationError(
            ["CSV dosyasında başlık satırı bulunamadı."]
        ) from exc

    normalized_header = [
        normalize_column_name(column)
        for column in header
    ]

    if any(not column for column in normalized_header):
        raise CSVValidationError(
            ["CSV dosyasında isimsiz kolon bulunamaz."]
        )

    duplicate_columns = sorted(
        {
            column
            for column in normalized_header
            if normalized_header.count(column) > 1
        }
    )

    if duplicate_columns:
        raise CSVValidationError(
            [
                "Tekrarlanan kolonlar: "
                + ", ".join(duplicate_columns)
            ]
        )

    missing_columns = sorted(
        set(REQUIRED_COLUMNS) - set(normalized_header)
    )

    if missing_columns:
        raise CSVValidationError(
            [
                "Eksik zorunlu kolonlar: "
                + ", ".join(missing_columns)
            ]
        )

    return normalized_header


def validate_sales_csv(file_contents: bytes) -> pd.DataFrame:
    """Satış CSV'sini doğrular ve dönüştürülmüş DataFrame döndürür."""
    csv_text = _decode_csv(file_contents)
    normalized_header = _validate_header(csv_text)

    try:
        dataframe = pd.read_csv(
            io.StringIO(csv_text),
            dtype=str,
        )
    except pd.errors.EmptyDataError as exc:
        raise CSVValidationError(
            ["CSV dosyasında veri bulunamadı."]
        ) from exc
    except pd.errors.ParserError as exc:
        raise CSVValidationError(
            ["CSV dosyasının satır yapısı geçersiz."]
        ) from exc

    dataframe.columns = normalized_header
    dataframe = dataframe.dropna(how="all").copy()

    if dataframe.empty:
        raise CSVValidationError(
            ["CSV dosyasında en az bir veri satırı bulunmalıdır."]
        )

    total_rows = len(dataframe)
    invalid_row_indices: set[int] = set()

    errors: list[str] = []

    for column in TEXT_COLUMNS:
        empty_mask = (
            dataframe[column].isna()
            | dataframe[column]
            .fillna("")
            .str.strip()
            .eq("")
        )

        if empty_mask.any():
            invalid_row_indices.update(
                dataframe.index[empty_mask].tolist()
            )
            row_numbers = (
                dataframe.index[empty_mask] + 2
            ).tolist()

            errors.append(
                f"{column} alanı boş olan satırlar: "
                f"{row_numbers}"
            )

        dataframe[column] = (
            dataframe[column]
            .fillna("")
            .str.strip()
        )

    parsed_dates = pd.to_datetime(
        dataframe["date"],
        format="%Y-%m-%d",
        errors="coerce",
    )

    invalid_date_mask = parsed_dates.isna()

    if invalid_date_mask.any():
        invalid_row_indices.update(
            dataframe.index[invalid_date_mask].tolist()
        )
        row_numbers = (
            dataframe.index[invalid_date_mask] + 2
        ).tolist()

        errors.append(
            "Geçersiz tarih bulunan satırlar: "
            f"{row_numbers}. Beklenen format: YYYY-MM-DD"
        )

    dataframe["date"] = parsed_dates

    quantity = pd.to_numeric(
        dataframe["quantity"],
        errors="coerce",
    )

    invalid_quantity_mask = (
        quantity.isna()
        | (quantity <= 0)
        | (quantity % 1 != 0)
    )

    if invalid_quantity_mask.any():
        invalid_row_indices.update(
            dataframe.index[invalid_quantity_mask].tolist()
        )
        row_numbers = (
            dataframe.index[invalid_quantity_mask] + 2
        ).tolist()

        errors.append(
            "quantity pozitif tam sayı olmayan satırlar: "
            f"{row_numbers}"
        )

    dataframe["quantity"] = quantity

    for column in ("price", "total"):
        numeric_values = pd.to_numeric(
            dataframe[column],
            errors="coerce",
        )

        invalid_numeric_mask = (
            numeric_values.isna()
            | (numeric_values < 0)
        )

        if invalid_numeric_mask.any():
            invalid_row_indices.update(
                dataframe.index[
                    invalid_numeric_mask
                ].tolist()
            )
            row_numbers = (
                dataframe.index[invalid_numeric_mask] + 2
            ).tolist()

            errors.append(
                f"{column} geçerli ve negatif olmayan "
                f"bir sayı değil; satırlar: {row_numbers}"
            )

        dataframe[column] = numeric_values

    duplicate_mask = dataframe.duplicated(
        subset=list(REQUIRED_COLUMNS),
        keep=False,
    )

    if duplicate_mask.any():
        invalid_row_indices.update(
            dataframe.index[duplicate_mask].tolist()
        )
        row_numbers = (
            dataframe.index[duplicate_mask] + 2
        ).tolist()

        errors.append(
            f"Tekrarlanan satış satırları: {row_numbers}"
        )

    if errors:
        raise CSVValidationError(
            errors=errors,
            total_rows=total_rows,
            invalid_rows=len(invalid_row_indices),
        )
    
    dataframe["quantity"] = (
        dataframe["quantity"].astype("Int64")
    )
    return dataframe