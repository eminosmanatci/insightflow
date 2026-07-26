import { formatCurrency } from "../../utils/dashboard";
import RankingTable from "./RankingTable";

const PRODUCT_COLUMNS = [
  {
    key: "product",
    label: "Ürün",
    primary: true,
    render: (product) => product.product_name,
  },
  {
    key: "quantity",
    label: "Adet",
    align: "right",
    render: (product) =>
      Number(product.quantity_sold ?? 0).toLocaleString("tr-TR"),
  },
  {
    key: "revenue",
    label: "Gelir",
    align: "right",
    emphasize: true,
    render: (product) => formatCurrency(product.total_revenue),
  },
];

function ProductTable({ data, loading }) {
  return (
    <RankingTable
      title="En Çok Gelir Getiren Ürünler"
      description="Seçilen dönemdeki ilk 5 ürün"
      columns={PRODUCT_COLUMNS}
      rows={data}
      loading={loading}
      emptyMessage="Seçilen dönemde ürün verisi bulunamadı."
      getRowKey={(product, index) => `${product.product_name}-${index}`}
    />
  );
}

export default ProductTable;
