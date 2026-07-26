import { formatCurrency } from "../../utils/dashboard";
import RankingTable from "./RankingTable";

const CUSTOMER_COLUMNS = [
  {
    key: "customer",
    label: "Müşteri",
    primary: true,
    render: (customer) => customer.customer_name,
  },
  {
    key: "transactions",
    label: "İşlem",
    align: "right",
    render: (customer) =>
      Number(customer.transaction_count ?? 0).toLocaleString("tr-TR"),
  },
  {
    key: "revenue",
    label: "Gelir",
    align: "right",
    emphasize: true,
    render: (customer) => formatCurrency(customer.total_revenue),
  },
];

function CustomerTable({ data, loading }) {
  return (
    <RankingTable
      title="En Değerli Müşteriler"
      description="Seçilen dönemde en yüksek gelir sağlayan ilk 5 müşteri"
      columns={CUSTOMER_COLUMNS}
      rows={data}
      loading={loading}
      emptyMessage="Seçilen dönemde müşteri verisi bulunamadı."
      getRowKey={(customer, index) => `${customer.customer_name}-${index}`}
    />
  );
}

export default CustomerTable;
