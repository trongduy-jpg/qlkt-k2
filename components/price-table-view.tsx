type PriceTableRow = {
  metal: string;
  source: string;
  purity: string;
  value: string;
  status: string;
};

type PriceTableViewProps = {
  isVisible: boolean;
  rows: PriceTableRow[];
};

export function PriceTableView({ isVisible, rows }: PriceTableViewProps) {
  return (
    <section className={`${isVisible ? "block" : "hidden"} rounded-md border border-line bg-white/94 p-4 shadow-sm`}>
      <h3 className="text-base font-bold text-ink">Giá & công thức tính</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-line bg-paper text-left text-xs uppercase text-zinc-500">
              <th className="px-3 py-3">Kim loại</th>
              <th className="px-3 py-3">Nguồn / công thức</th>
              <th className="px-3 py-3">Hàm lượng</th>
              <th className="px-3 py-3">Giá trị</th>
              <th className="px-3 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metal} className="border-b border-line/70">
                <td className="px-3 py-3 font-semibold text-ink">{row.metal}</td>
                <td className="px-3 py-3 text-zinc-700">{row.source}</td>
                <td className="px-3 py-3 text-zinc-700">{row.purity}</td>
                <td className="px-3 py-3 text-zinc-700">{row.value}</td>
                <td className="px-3 py-3 text-zinc-700">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
