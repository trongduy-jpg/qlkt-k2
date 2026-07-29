TÀI LIỆU KIẾN TRÚC HỆ THỐNG: QUẢN LÝ TIẾN ĐỘ, GIÁ VÀ HAO HỤT NGUYÊN VẬT LIỆU KIM HOÀN

1. Mục tiêu Kiến trúc Hệ thống

Trong quản trị sản xuất kim hoàn, kiểm soát nguyên vật liệu (NVL) là yếu tố sống còn để bảo vệ biên lợi nhuận. Với biến động giá vàng và kim loại quý (Platinum, Palladium) diễn ra theo từng phút, hệ thống yêu cầu một kiến trúc có khả năng xử lý dữ liệu với độ chính xác tuyệt đối và tính thời gian thực cao. Dựa trên dữ liệu thực tế từ kỳ thực hiện Tháng 05/2026, kiến trúc này được thiết kế để giải quyết bài toán hao hụt và công nợ thợ một cách triệt để.

04 mục tiêu cốt lõi của hệ thống:

1. Tính chính xác tuyệt đối trong quy đổi trọng lượng: Đảm bảo khả năng tính toán đa đơn vị (Oz, Gram, Chỉ, Lượng) với độ chính xác lên đến 9 chữ số thập phân. Áp dụng tỷ lệ quy đổi chuẩn: 1 Oz = 31.1 Gram.
2. Minh bạch hóa dòng dữ liệu (Traceability): Truy xuất nguồn gốc từ lệnh sản xuất (DHAG) đến từng nhân viên thực hiện (ví dụ: Lê Văn Tùng - TD003). Hệ thống phải phân định rõ trạng thái giao dịch: "Xác định" (Finalized) đối với các lệnh đã đối soát và "Treo nợ" (Pending) đối với các NVL đang trong quá trình gia công cán kéo/cán dát.
3. Tự động hóa và dự phòng dữ liệu giá: Tự động hóa cập nhật từ KITCO và Vietcombank (tỷ giá USD đạt mức 26,395 VND vào Tháng 05/2026). Đồng thời, cung cấp lớp Integration Layer để ingest dữ liệu từ các bảng theo dõi nội bộ như [KT409(L3)-AGVN][C109] khi có sai lệch hoặc mất kết nối API.
4. Kiểm soát hao hụt định mức vs. thực tế: Tự động tính toán "Hao hụt vượt" để lập bảng bồi thường, chuyển đổi sang giá trị tương đương vàng 99.99 (VND/Chỉ).

2. Kiến trúc Tổng thể (High-level Architecture)

Hệ thống được xây dựng trên mô hình 3 lớp (3-tier) bền vững, tối ưu cho tính toàn vẹn dữ liệu (ACID).

* Frontend: Giao diện Web/Mobile Dashboard hỗ trợ nhập liệu chi tiết theo cột: KCP xuất thợ, Nhập về KCP, Diễn giải công đoạn (Cán kéo, Cán dát, Nhập sau ra dây).
* Backend: Xử lý logic nghiệp vụ phức tạp, đặc biệt là các công thức tính giá kim loại đặc thù. Ví dụ, công thức tính giá PT900 phải được xử lý qua 4 bước: (90% Price PT) + (10% Price PD) + (13% Tax trên phần 10% PD) = Total Price.
* Database (PostgreSQL): Mandate sử dụng kiểu dữ liệu Decimal/Numeric(18, 9) cho trọng lượng và Numeric(18, 2) cho tiền tệ. Tuyệt đối không sử dụng kiểu Floating-point để tránh sai số tích lũy trong kim loại quý.

3. Các Module Chính của Hệ thống

3.1. Module Quản lý Giá (Price Engine)

Hệ thống xử lý hai luồng giá song song:

* Giá thị trường: KITCO (PT, PD, Bạc) và Vietcombank (USD).
* Giá bình quân mua vào: Tính toán dựa trên nhật ký mua hàng thực tế (Ví dụ: Tháng 05/2026 có các đợt mua ngày 06/05, 12/05, 14/05 để xác định mức giá bình quân 154,067,000 VND/Lượng).

3.2. Module Quản lý Kho NVL

Theo dõi tồn kho theo mã NVL cụ thể:

* Vàng solid: NL750W (18K trắng), NL750Y (18K vàng), NL416W (10K).
* Bột kim loại: NLBOT708R (Bột 17K), NLBOT-PD-PT900.
* Quản lý sự kiện "Nhập bột cuối tháng" như một giao dịch điều chỉnh kho định kỳ.

3.3. Module Quản lý Sản xuất & Trạng thái Công nợ

Sử dụng logic State Machine để quản lý vòng đời lệnh sản xuất:

* Issued (Xuất thợ): Ghi nhận trọng lượng KCP xuất.
* Pending (Treo nợ): NVL đang trong xưởng, chưa đối soát hao hụt.
* Reconciled (Xác định): Đã nhập về, tính toán hao hụt định mức.
* Finalized (Quyết toán): Đã áp giá tháng và tính thành tiền bồi thường.

3.4. Module Kế toán & Bồi thường

Tự động quy đổi mọi hao hụt vượt định mức về vàng 24K (99.99%). Ví dụ: Nhân viên Lê Văn Tùng (TD003) có hao hụt vượt 0.66gr vàng 18K, hệ thống quy đổi thành 0.13 chỉ 24K và áp giá 15,407,000 VND/chỉ để ra số tiền bồi thường 2,033,927 VND.

4. Luồng Dữ liệu Tổng thể

1. Giai đoạn Khởi tạo: Lập lệnh DHAG -> Chỉ định mã hàng (ví dụ: BI50416W - Bi 5.0 trơn 10K).
2. Giai đoạn Cấp phát: Xuất NVL cho thợ (Mã NL750W, Trọng lượng 23.00gr) -> Trạng thái: Treo nợ.
3. Giai đoạn Thu hồi: Nhập sản phẩm sau công đoạn (Cán kéo/Cán dát) -> Ghi nhận trọng lượng Nhập về KCP. Hệ thống tự động phân loại "Đạt QC" hoặc "Lỗi".
4. Giai đoạn Đối soát: Tính toán: (Trọng lượng Xuất - Trọng lượng Nhập) - Hao hụt định mức = Hao hụt vượt.
5. Giai đoạn Quyết toán: Áp giá phê duyệt tháng từ Module Giá -> Xuất báo cáo bồi thường tổng hợp.

5. Đề xuất Công nghệ Phù hợp

Thành phần	Công nghệ	Lý do kỹ thuật
Frontend	React.js	Hiển thị bảng dữ liệu lớn (Báo cáo chi tiết hao hụt) mượt mà.
Backend	NestJS (Node.js)	Tính toán song song và tích hợp API KITCO/Vietcombank ổn định.
Database	PostgreSQL	Hỗ trợ Unit_Conversion_Matrix và ràng buộc ACID nghiêm ngặt.
Integration	Python/Pandas	Xử lý ingest các file Excel/Spreadsheet nội bộ làm fallback giá.
Caching	Redis	Lưu lịch sử giá KITCO theo giây để phục vụ tính toán tức thời.

6. Thiết kế Phân quyền và Bảo mật (RBAC)

* Craftsman (Thợ): Chỉ xem nhật ký cá nhân và tình trạng công nợ "Treo nợ".
* Inventory Accountant (Kế toán kho): Nhập xuất NVL, ghi nhận trọng lượng cân thực tế.
* General Accountant (Kế toán tổng hợp): Duyệt giá tính hao hụt tháng, cấu hình định mức cho từng công đoạn.
* Director (BGĐ): Phê duyệt bảng trình duyệt giá (ví dụ: Phê duyệt giá vàng 15,407,000 VND/chỉ cho Tháng 05/2026).

7. Cơ chế Lưu lịch sử thay đổi (Audit Log)

Hệ thống ghi lại mọi biến động dữ liệu với cấu trúc:

* Entity: PriceHistory, LossNorm, InventoryNote.
* Action: Trọng tâm giám sát việc sửa đổi "Giá vàng bình quân" và "Tỷ lệ hao hụt định mức".
* Content: Lưu giá trị trước và sau thay đổi (Old Value -> New Value) kèm IP và Timestamp đến mili giây.

8. Quản lý File đính kèm và Chứng từ Số

Mọi giao dịch xuất/nhập NVL đều phải đính kèm minh chứng:

* Hình ảnh: Ảnh chụp màn hình cân điện tử tại thời điểm "Nhập sau cán dát".
* Chứng từ: Scan hóa đơn mua NVL vàng/bạc/PT gắn với mã lệnh trong nhật ký sản xuất.
* Storage: Sử dụng S3-compatible storage với link URL bảo mật (Signed URL).

9. Cơ chế Báo cáo, Dashboard và Cảnh báo

* Báo cáo So sánh: Dashboard so sánh chênh lệch giữa Giá vàng công ty mua vào thực tế vs. Giá KITCO (ĐVT: VND/Chỉ).
* Dashboard Hiệu suất: Theo dõi tỷ lệ hao hụt của thợ Lê Văn Tùng qua các tháng để cảnh báo nếu vượt ngưỡng an toàn (ví dụ > 0.5% tùy loại vàng).
* Alerts: Cảnh báo tức thì qua Telegram/Email nếu phát hiện giao dịch sửa đổi trọng lượng sau khi đã chuyển sang trạng thái "Xác định".

10. Cơ chế Sao lưu và Phục hồi Dữ liệu

* Chiến lược Backup: Daily Full Backup vào 0h00; Incremental Backup mỗi 15 phút cho các bảng giao dịch vàng.
* RTO/RPO: Thời gian phục hồi (RTO) < 2 giờ; Mức độ mất dữ liệu tối đa (RPO) < 15 phút, đảm bảo tính liên tục cho xưởng sản xuất.

11. Đề xuất Cấu trúc Thư mục Source Code

/jewelry-erp
├── /backend/src
│   ├── /modules
│   │   ├── /price-engine (Logic PT900: PT*0.9 + PD*0.1 + Tax)
│   │   ├── /production (State Machine: Issued -> Finalized)
│   │   ├── /compensation (Loss calc, Unit conversion Oz->Gram)
│   │   └── /inventory (Materials: NL750W, NLBOT708R)
│   ├── /models
│   │   ├── LossNormDefinition.entity.ts
│   │   ├── CraftsmanCompensation.entity.ts
│   │   └── MonthlyPriceReview.entity.ts
├── /frontend/src
│   ├── /components/LossTable (Custom Decimal display)
│   └── /store/PriceStore (Real-time KITCO sync)


12. Định hướng Triển khai (MVP & Expansion)

* Giai đoạn MVP: Tập trung Module Quản lý giá (tính giá bình quân mua vào) và Nhật ký sản xuất cho thợ TD003. Triển khai logic "Treo nợ" để quản lý nguyên liệu chưa hoàn thành.
* Giai đoạn Expansion: Tự động hóa hoàn toàn luồng giá KITCO/DailyMetalPrice qua API. Tích hợp mã QR trên từng túi NVL để tự động hóa việc "Nhập sau cán kéo/cán dát", giảm thiểu sai sót nhập liệu thủ công.

Tài liệu này đóng vai trò là khung kỹ thuật chuẩn để phát triển hệ thống ERP chuyên biệt cho ngành kim hoàn, đảm bảo tính bền vững và minh bạch trong quản trị tài sản cao giá.
