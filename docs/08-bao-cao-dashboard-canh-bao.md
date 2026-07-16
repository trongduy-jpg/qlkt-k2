ĐỀ XUẤT KIẾN TRÚC HỆ THỐNG BÁO CÁO, DASHBOARD VÀ CẢNH BÁO QUẢN TRỊ HAO HỤT & GIÁ NGUYÊN VẬT LIỆU (NVL)

1. KHUNG CHIẾN LƯỢC VÀ TẦM QUAN TRỌNG CỦA HỆ THỐNG BÁO CÁO

Trong ngành kim hoàn, quản trị nguyên vật liệu quý (Vàng, Bạc, Platinum, Palladium) không chỉ là bài toán kiểm kho thông thường mà là yếu tố sống còn bảo vệ biên lợi nhuận. Tại ASIANA GOLD, việc chuẩn hóa dữ liệu từ "Bảng duyệt giá" và "Chi tiết hao hụt" là then chốt để đảm bảo tính minh bạch tài chính và công bằng trong quản trị nhân sự.

Dữ liệu thực tế giai đoạn tháng 01-05/2026 cho thấy sự biến động khốc liệt của giá nguyên liệu: từ mức 149.350.000 VND/lượng (Tháng 01) tăng vọt lên 173.250.000 VND/lượng (Tháng 04) trước khi điều chỉnh về 154.067.000 VND/lượng (Tháng 05). Sự biến động này ảnh hưởng trực tiếp đến giá trị bồi thường của thợ. Nếu hệ thống không cập nhật giá theo thời gian thực hoặc thiếu sự đồng bộ dữ liệu giữa các kỳ, doanh nghiệp sẽ đối mặt với rủi ro thất thoát kép: rủi ro tài chính do biến động giá và rủi ro nhân sự do bồi thường không chính xác. Việc số hóa và tự động hóa hệ thống báo cáo là giải pháp duy nhất để tối ưu hóa hiệu suất thợ và bảo toàn vốn lưu động.

2. HỆ THỐNG BÁO CÁO NGHIỆP VỤ (OPERATIONAL REPORTS)

2.1. Báo Cáo Biến Động Giá NVL Theo Kỳ (Vàng, Bạc, PT, PD, USD)

Báo cáo này thiết lập cơ sở giá chuẩn để tính toán mọi giá trị liên quan đến sản xuất và bồi thường hao hụt.

* Mục đích: Cung cấp tham chiếu giá chuẩn, đánh giá hiệu quả bộ phận thu mua (Procurement Efficiency) thông qua so sánh giá thực tế và giá KITCO.
* Người xem: Kế toán NVL, Kế toán trưởng, Ban Giám đốc.
* Cấu trúc dữ liệu chính (Dựa trên tỷ giá USD 26.395):

Loại NVL	Giá niêm yết (USD/Oz)	Tỷ giá USD (VND)	Giá quy đổi (VND/Gr)	Giá quy đổi (VND/Chỉ)	Chênh lệch so với kỳ trước (%)
Vàng 24K (Tháng 05/2026)	2.387,31*	26.395	4.108.453	15.406.700	-11,07%
PT900 (Tháng 05/2026)	1.872,14	26.395	1.589.000	5.959.000	-3,47%
Bạc (Tháng 05/2026)	75,29	26.395	64.000	240.000	+1,59%

*Lưu ý: Đối với Vàng, kế toán cần truy xuất giá niêm yết từ KITCO để hoàn thiện cột USD/Oz giống như Bạc và PT nhằm đảm bảo tính toàn vẹn của báo cáo.

2.2. Báo Cáo Chi Tiết Hao Hụt Và Bồi Thường Theo Thợ

Báo cáo tập trung vào mã nhân viên (Ví dụ: Lê Văn Tùng - TD003) và các mã hàng thực tế như NL750W (Vàng 18K trắng), NL416W (Vàng 10K trắng).

* Phân loại hiệu suất thợ (Performance Grouping):
  * Nhóm A (Excellent): Hao hụt thực tế < Định mức.
  * Nhóm B (Standard): Hao hụt thực tế nằm trong ngưỡng cho phép (0% - 5% so với định mức).
  * Nhóm C (Risk): Hao hụt vượt ngưỡng > 5% so với định mức (Yêu cầu đào tạo lại hoặc kỷ luật).
* Dữ liệu tiêu biểu (Tháng 06/2026): Thợ Lê Văn Tùng (TD003) có tổng hao hụt 0.66gr (Vàng 18K), giá bồi thường áp dụng 15.407.000 VND/Chỉ, tổng thành tiền bồi thường là 2.033.927 VND.

2.3. Báo Cáo Tổng Hợp Kết Chuyển Nguyên Vật Liệu Cuối Kỳ

Đảm bảo luồng dữ liệu liên tục giữa dở dang (WIP) đầu kỳ và cuối kỳ.

* Mục đích: Kiểm soát lượng bột vàng thu hồi và hàng đang dở dang tại xưởng.
* Ví dụ thực tế: Theo dõi lượng kết chuyển 155.42 gr của thợ Lê Văn Tùng (ngày 30/03/2024 tại công đoạn Cán kéo) để làm số dư đầu kỳ cho tháng 04/2024.
* Chỉ tiêu kiểm soát: Nhập bột cuối tháng (Ví dụ: Bột vàng 750 trắng, Bột PT900-PD) phải khớp với định mức thu hồi thực tế.

3. HỆ THỐNG DASHBOARD QUẢN TRỊ (MANAGEMENT DASHBOARDS)

3.1. Dashboard Phân Tích Xu Hướng Giá Và Chi Phí NVL

* Biểu đồ đường (Line Chart): So sánh giá Vàng bình quân công ty mua vào vs. Giá thế giới (KITCO). Thể hiện trực quan đỉnh giá 173.25M (Tháng 04) so với đáy 149.35M (Tháng 01).
* Thẻ chỉ số (Scorecard): Hiển thị Giá tính hao áp dụng (Ví dụ: 15.407.000 VND/Chỉ cho Tháng 05/2026).
* Phân tích cơ cấu: Tỷ trọng giá trị NVL đang lưu thông (Vàng vs. Platinum vs. Bạc).

3.2. Dashboard Giám Sát Hiệu Suất Sản Xuất Và Hao Hụt

* Biểu đồ tròn (Pie Chart): Tỷ trọng hao hụt theo tuổi vàng (Ví dụ: 18K chiếm bao nhiêu % tổng thiệt hại).
* Bảng xếp hạng (Ranking): Top 5 thợ thuộc Nhóm C (Hao hụt vượt cao nhất).
* Biểu đồ vùng (Area Chart): Tổng số tiền bồi thường thu hồi qua các tháng (Ghi nhận mức 2.033.927 VND của thợ TD003 làm điểm dữ liệu thực tế).

4. HỆ THỐNG CẢNH BÁO TỰ ĐỘNG (SMART ALERTS)

1. Cảnh báo giá biến động: Tự động gửi thông báo khi giá vàng thế giới hoặc tỷ giá USD (mức tham chiếu 26.395) biến động >3% trong 24h.
2. Cảnh báo vượt ngưỡng hao hụt: Kích hoạt khi lệnh sản xuất (LSX) có hao hụt thực tế vượt >5% định mức.
3. Cảnh báo lỗi dữ liệu (#N/A, #DIV/0!): Phát hiện tức thời các lỗi tính toán như đã xảy ra trong tháng 02-03/2026 do thiếu dữ liệu nguồn, yêu cầu xử lý trước khi đóng kỳ.
4. Cảnh báo tính toàn vẹn dữ liệu (Data Integrity): Cảnh báo nếu dữ liệu phiếu xuất/nhập tại trạm sản xuất không được số hóa trong vòng 2 giờ kể từ khi phát sinh thực tế.

5. CÔNG THỨC VÀ LOGIC TÍNH TOÁN CỐT LÕI

Quy trình tính toán	Công thức áp dụng
Quy đổi Oz sang Gram	1 Oz = 31.1 Gram
Quy đổi Gram sang Chỉ	1 Chỉ = 3.75 Gram
Giá quy đổi (VND/Gr)	(Giá USD/Oz * Tỷ giá USD) / 31.1
Giá PT900 (90% PT + 10% PD)	(90% Giá PT + 10% Giá PD) + (13% Thuế PD * 10% Giá PD)
Hao hụt quy 99.99	Hao hụt thực tế * (Tuổi vàng / 99.99)
Thành tiền bồi thường	(Hao hụt vượt / 3.75) * Giá tính hao (VND/Chỉ)

Ghi chú: Toàn bộ hệ thống Dashboard và Báo cáo phải được số hóa ngay tại trạm sản xuất để đảm bảo tính Real-time, loại bỏ độ trễ của nhập liệu thủ công.
