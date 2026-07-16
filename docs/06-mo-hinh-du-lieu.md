ĐỀ XUẤT MÔ HÌNH DỮ LIỆU HỆ THỐNG THEO DÕI TIẾN ĐỘ NGUYÊN VẬT LIỆU NGÀNH TRANG SỨC

1. TỔNG QUAN CHIẾN LƯỢC VỀ CƠ SỞ DỮ LIỆU

Trong quản trị ERP ngành hoàn kim, nguyên vật liệu (vàng, bạc, bạch kim) không chỉ là vật tư sản xuất mà là tài sản tài chính có biến động giá trị theo từng giây. Việc kiểm soát hao hụt và giá trị quy đổi là yếu tố sống còn đối với sự ổn định tài chính của doanh nghiệp.

Mục tiêu của mô hình dữ liệu này là thiết lập một hệ thống theo dõi đa tầng: từ quản lý kỹ thuật (trọng lượng thực tế tại các công đoạn Cán kéo, Cán dát, Xuất bột) đến quản lý tài chính (giá trị quy đổi 99.99 và giá trị bồi thường). Cấu trúc dữ liệu được thiết kế để giải quyết bài toán cốt lõi: đồng bộ hóa linh hoạt giữa giá mua vào thực tế và giá niêm yết thế giới (Kitco) nhằm đảm bảo tính minh bạch trong việc tính toán bồi thường hao hụt giữa doanh nghiệp và người thợ.

2. DANH MỤC DỮ LIỆU GỐC (MASTER DATA TABLES)

Việc chuẩn hóa danh mục là tiền đề để ngăn chặn các sai số hệ thống. Đặc biệt, "Tuổi vàng" phải được số hóa thành các hệ số thập phân chính xác để phục vụ các phép tính quy đổi tự động. Một sai sót nhỏ trong hệ số hàm lượng (ví dụ giữa 14K và 15K) sẽ làm sai lệch toàn bộ báo cáo tài chính cuối kỳ.

Tên bảng	Trường dữ liệu chính	Khóa chính (PK)	Khóa ngoại (FK)
Nhân Viên (Workers)	id, mã_nv (TDxxx), tên_thợ, bộ_phận	id	
Loại Nguyên Vật Liệu (Materials)	id, mã_nvl, tên_nvl, hàm_lượng_phẩm_chất	id	
Công Đoạn (Processes)	id, tên_công_đoạn (Cán kéo, Cán dát, Xuất bột)	id	
Định Mức Sản Xuất (ProductionNorms)	id, process_id, material_id, tỉ_lệ_hao_cho_phép	id	process_id, material_id
Danh Mục Sản Phẩm (Products)	id, mã_hàng (ví dụ: BI50416W), tên_hàng	id	

Cấu hình hệ số hàm lượng (Ground Truth): Hệ thống bắt buộc áp dụng các hệ số sau cho bảng Materials:

* Vàng: 24K (0.9999), 18K (0.75), 17K (0.708), 16K (0.68), 15K (0.61), 10K (0.416).
* Kim loại quý khác: PT950 (0.95), PT900 (0.90), BAC92.5 (0.925).

3. QUẢN LÝ BIẾN ĐỘNG GIÁ VÀ TỶ GIÁ (PRICING & FX TABLES)

Chiến lược quản trị rủi ro giá đòi hỏi hệ thống phải lưu vết cả giá mua vào bình quân (phục vụ kế toán kho) và giá niêm yết thế giới (phục vụ tính bồi thường theo thị trường).

Tên bảng	Trường dữ liệu chính	Khóa chính (PK)	Khóa ngoại (FK)
Nhật Ký Giá Vàng (GoldPriceLogs)	id, ngày_mua, giá_mua_vào_lượng, giá_bình_quân, giá_quy_đổi_chỉ, nguồn_dữ_liệu	id	material_id
Giá Kim Loại & Tỷ Giá (MetalForexLogs)	id, ngày_áp_dụng, loại_kl (PT, PD, Bạc), giá_niêm_yết_usd_oz, tỷ_giá_usd, thue_pd_rate (13%), conversion_factor (31.1)	id	

Phân tích nghiệp vụ đặc thù: Đối với dòng sản phẩm PT900-PD, logic tính toán giá thành phải bóc tách: Tổng giá = (90% PT + 10% PD) + 13% Thuế PD. Việc lưu trữ riêng biệt thue_pd_rate và hệ số quy đổi conversion_factor (1oz = 31.1 gram) trong bảng MetalForexLogs đảm bảo tính chính xác tuyệt đối khi chuyển đổi từ giá USD/OZ thế giới sang VND/GR thực tế tại xưởng.

4. THEO DÕI TIẾN ĐỘ VÀ GIAO DỊCH SẢN XUẤT (PRODUCTION TRANSACTIONS)

Mọi biến động nguyên liệu được quản lý theo cơ chế "Xuất - Nhập - Tồn" chặt chẽ tại từng công đoạn. Để đảm bảo hiệu năng truy xuất với khối lượng giao dịch lớn, hệ thống cần đánh chỉ mục (Indexing) cho các trường mã_nv và mã_lsx.

Tên bảng	Trường dữ liệu chính	Khóa chính (PK)	Khóa ngoại (FK)
Lệnh Sản Xuất (ProductionOrders)	id, mã_lsx, ngày_tạo, trạng_thái	id	
Nhật Ký Cấp Phát (MaterialMovements)	id, ngày_phát_sinh, trọng_lượng_xuất, trọng_lượng_nhập, trọng_lượng_đạt_qc, trọng_lượng_lỗi, trạng_thái (Xác định/Treo nợ), diễn_giải	id	order_id, worker_id, process_id, material_id

Tính minh bạch dữ liệu: Trạng thái "Treo nợ" được áp dụng cho các giao dịch chưa hoàn tất kiểm soát phẩm chất (KCP), giúp kế toán tách biệt giữa công nợ thực tế và hàng đang xử lý, ngăn chặn thất thoát nguyên liệu trong quá trình luân chuyển giữa thợ cán kéo và thợ cán dát.

5. MÔ HÌNH TÍNH TOÁN HAO HỤT VÀ BỒI THƯỜNG (LOSS & COMPENSATION FACT TABLE)

Đây là bảng trung tâm (Fact Table) chuyển đổi các chỉ số kỹ thuật sang giá trị tài chính. Dữ liệu tại đây phải được khóa theo kỳ kế toán (period_id) để đảm bảo tính toàn vẹn của lịch sử bồi thường.

Tên bảng/View	Trường dữ liệu chính	Khóa chính (PK)	Khóa ngoại (FK)
Tổng Hợp Hao Hụt (LossReports)	id, period_id (Tháng/Năm), tổng_hao_hụt_gr, hao_hụt_định_mức, hao_hụt_vượt, quy_9999_gr, đơn_giá_áp_dụng_chi, quy_đổi_chỉ, thành_tiền_bồi_thường, status (Xác định/Treo nợ/Bồi thường)	id	movement_id, period_id

Logic toán học và Unit Consistency:

1. Trọng lượng: Theo dõi bằng Gram (gr) tại xưởng.
2. Tài chính: Tính toán bằng đơn vị Chỉ (1 Chỉ = 3.75 gr).
3. Giá áp dụng: Tự động lấy từ GoldPriceLogs theo kỳ.
  * Ví dụ thực tế: Kỳ thực hiện Tháng 05/2026, hệ thống áp dụng đơn giá 15,407,000 VND/chỉ (dựa trên giá bình quân mua vào 154,067,000 VND/lượng).
4. Tính bồi thường: Số tiền = [Hao hụt thực tế - Hao hụt định mức] * Hệ số hàm lượng * (Đơn giá chỉ / 3.75).

6. TỔNG KẾT VÀ QUAN HỆ GIỮA CÁC BẢNG (ERD LOGIC)

Mô hình dữ liệu thiết lập một hệ sinh thái thông tin khép kín thông qua các mối quan hệ 1-Nhiều (1-N) then chốt:

1. Workers (1) ➔ MaterialMovements (N): Truy xuất lịch sử cấp phát và hiệu suất làm việc của từng thợ.
2. Materials (1) ➔ GoldPriceLogs (N): Theo dõi biến động giá mua vào theo từng loại tuổi vàng.
3. Processes (1) ➔ ProductionNorms (N): Áp dụng định mức hao hụt riêng biệt cho từng công đoạn kỹ thuật (Cán kéo 0% vs. các công đoạn khác).
4. MaterialMovements (1) ➔ LossReports (1): Đảm bảo mỗi giao dịch xuất nhập đều có một bản ghi đối soát tài chính minh bạch.

Việc triển khai mô hình này không chỉ dừng lại ở báo cáo hao hụt mà còn là nền tảng cốt lõi để tự động hóa bảng lương thợ, quản trị tồn kho nguyên liệu quý và tối ưu hóa dòng vốn lưu động cho doanh nghiệp trang sức.
