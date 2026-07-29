ĐỀ XUẤT KIẾN TRÚC GIAO DIỆN HỆ THỐNG QUẢN LÝ HAO HỤT VÀ GIÁ NGUYÊN VẬT LIỆU ASIANA GOLD 2026

1. Phân tích bối cảnh và Tầm nhìn Hệ thống

Dựa trên dữ liệu từ các "Bảng trình duyệt giá" và "Báo cáo tổng hợp hao hụt" giai đoạn 2022-2026, ASIANA GOLD đang vận hành dựa trên các bảng tính Excel rời rạc. Điều này gây ra độ trễ lớn trong việc cập nhật biến động giá kim loại quý và dẫn đến nguy cơ sai sót cao khi tính toán bồi thường hao hụt cho thợ. Việc số hóa quy trình quản lý thông qua một hệ thống ERP tập trung không chỉ là nâng cấp kỹ thuật mà là một bước đi chiến lược nhằm tối ưu hóa lợi nhuận và minh bạch hóa công nợ.

Các Mục tiêu Cốt lõi (Core Objectives):

* Số hóa Nguồn dữ liệu (Single Source of Truth): Chuyển đổi từ nhập liệu thủ công sang kết nối API dữ liệu giá thế giới và tỷ giá ngân hàng, đảm bảo tính tức thời.
* Kiểm soát rủi ro tài chính: Tự động hóa các công thức quy đổi phức tạp, đặc biệt là các loại thuế phí đặc thù (như thuế Palladium) và tỷ lệ quy đổi tuổi vàng.
* Tối ưu hóa Hiệu suất Sản xuất: Theo dõi sát sao tỷ lệ hao hụt theo từng công đoạn (Cán kéo, Cán dát) để nhận diện biến động tay nghề thợ và thất thoát vật tư.

Việc thiết lập nền tảng dữ liệu đầu vào thông qua các giao diện chức năng dưới đây sẽ đảm bảo tính nhất quán cho toàn bộ chuỗi giá trị của ASIANA GOLD.

2. Danh sách Màn hình Chức năng Đề xuất

Hệ thống được thiết kế theo nguyên tắc tách biệt dữ liệu (Separation of Duties) để bảo mật tài chính và kiểm soát nội bộ.

Tên Màn hình	Vai trò chiến lược trong chuỗi cung ứng/sản xuất
Quản lý Giá & API Đầu vào	Thiết lập Master Data về đơn giá. Là "trục chính" cho mọi tính toán giá trị nguyên liệu.
Nhật ký Sản xuất & Thu hồi Bột	Ghi nhận Transactional Data tại xưởng. Theo dõi vòng đời nguyên liệu từ lúc xuất thợ đến khi thu hồi bột.
Phê duyệt Bồi thường & Khóa sổ	Điểm chốt chặn (Control Point) của BGĐ để phê duyệt chi phí và tất toán công nợ thợ.
Business Intelligence (BI) Dashboard	Phân tích xu hướng chênh lệch giá (Spread) và hiệu suất hao hụt đa kỳ (2022-2026).

Phân tích sâu: Việc tách biệt màn hình Nhập liệu giá (Bộ phận Kế toán NVL) và màn hình Tính toán hao hụt (Bộ phận Sản xuất/GSNB) là yêu cầu bắt buộc để ngăn chặn việc thao túng đơn giá bồi thường, đồng thời đảm bảo tính bảo mật của biên lợi nhuận công ty.

3. Chi tiết Màn hình Quản lý Giá Nguyên Vật Liệu (NVL)

Màn hình này số hóa các "Bảng trình duyệt giá" tháng 01-05/2026 với cơ chế tự động hóa cao.

* Mục đích: Cập nhật biến động giá Vàng, Bạc, PT, PD và tỷ giá USD.
* Người dùng chính: Kế toán nguyên vật liệu (KT NVL).
* Cơ chế Tích hợp API (Data Integration points):
  * Giá Vàng/Bạc/PT: Kết nối trực tiếp từ KITCO.
  * Giá Palladium (PD): Cập nhật tự động từ Daily Metal Price.
  * Tỷ giá USD: Kết nối API Vietcombank.
* Dữ liệu hiển thị & Cấu hình:
  * Vàng: Giá mua vào (VND/Lượng), Giá bình quân tháng, Giá quy đổi (VND/Chỉ).
  * PT900: Tự động tính theo công thức: (90% PT + 10% PD) + (13% Thuế Palladium trên phần 10% PD).
  * Tham số quy đổi: Cấu hình hệ số 1 Oz = 31.1 gram (Master Setting).
* Nút chức năng: [Lấy giá API], [Lưu tạm], [Kết chuyển giá bình quân], [View Log] (Audit Trail để theo dõi lịch sử chỉnh sửa giá).
* Trạng thái: Chờ duyệt, Đã duyệt, Đã kết chuyển (Khi đã kết chuyển, đơn giá sẽ bị khóa, không thể chỉnh sửa để đảm bảo tính toàn vẹn cho báo cáo hao hụt).

4. Chi tiết Màn hình Theo dõi Nhật ký Sản xuất & Hao hụt Chi tiết

Giao diện này quản trị chi tiết Transactional Data dựa trên dữ liệu thực tế của các thợ như Lê Văn Tùng (TD003).

* Mục đích: Ghi nhận thực tế xuất/nhập nguyên liệu và tách biệt công đoạn sản xuất.
* Người dùng chính: Giám sát nội bộ (GSNB), Kế toán sản xuất.
* Dữ liệu Master Data liên kết:
  * Mã hàng (Dropdown): NL750W (18K Trắng), NL416W (10K Trắng), NL750Y (18K Vàng), NL-PD-PT900.
  * Loại Vàng: 10K, 14K, 15K, 16K, 17K, 18K, 24K, Bạc 92.5, PT900-PD.
* Phân hệ Thu hồi Bột (Powder Recovery Module): Thiết kế giao diện nhập liệu riêng cho "Nhập bột cuối tháng" và "Xuất bột" để đối trừ hao hụt chính xác.
* Thông tin chi tiết phiếu:
  * Mã nhân viên, Lệnh sản xuất (Ví dụ: DHAG-26/03/02).
  * Trọng lượng KCP xuất thợ (Gr), Nhập về KCP (Gr), Trọng lượng đạt QC vs. Lỗi.
  * Trạng thái xử lý: Xác định (Đã xong), Treo nợ (Hàng đang trong quy trình WIP, chưa tính hao hụt để đảm bảo công bằng cho thợ).
* Nút chức năng: [Tính toán hao hụt tức thời], [Chốt tháng sản xuất], [In phiếu công nợ].

Phân tích "So What": Hệ thống sẽ tự động cảnh báo nếu tỷ lệ hao hụt thực tế vượt định mức (Hao hụt vượt). Việc theo dõi trạng thái Treo nợ giúp quản lý biết chính xác lượng nguyên liệu đang nằm trên bàn thợ, tránh việc tính nhầm tiền bồi thường khi sản phẩm chưa hoàn thiện.

5. Chi tiết Màn hình Phê duyệt Giá tính Hao hụt & Bồi thường Tháng

Đây là giao diện kiểm soát cuối cùng dành cho Ban Giám đốc (BOD).

* Mục đích: Tổng hợp dữ liệu hao hụt đã chốt và áp đơn giá đã duyệt để ra bảng tính bồi thường.
* Dữ liệu hiển thị:
  * Kỳ thực hiện (Tháng/Năm).
  * Tổng hao hụt thực tế (Gr) -> Quy quy 99.99 (Gr) -> Quy đổi ĐVT Chỉ.
  * Đơn giá áp dụng: Lấy từ màn hình Quản lý Giá NVL (Chỉ áp dụng các giá đã có trạng thái Đã duyệt).
  * Thành tiền bồi thường (VND).
* Tính năng đặc biệt:
  * Ghi chú điều chỉnh: Nếu BOD điều chỉnh giảm bồi thường cho thợ, hệ thống bắt buộc nhập Adjustment Reason (Lý do điều chỉnh).
  * Data Validation: Hệ thống ngăn chặn việc phê duyệt nếu dữ liệu giá của tháng đó chưa được Kế toán trưởng duyệt.
* Nút chức năng: [Phê duyệt & Ban hành], [Từ chối/Yêu cầu tính lại], [Khóa sổ kỳ].
* Quy tắc hệ thống: Sau khi click [Phê duyệt], toàn bộ dữ liệu của kỳ đó sẽ bị đóng băng (Closed Period), không thể sửa đổi hồi tố.

6. Chi tiết Màn hình Báo cáo Phân tích & Xu hướng (BI)

Cung cấp cái nhìn toàn cảnh về sức khỏe tài chính và vận hành của ASIANA GOLD.

* Mục đích: Phân tích chênh lệch giá và hiệu suất sản xuất đa năm.
* Công cụ Di cư Dữ liệu (Data Migration Tool): Tính năng Import dữ liệu Excel lịch sử (2022, 2023, 2024, 2025) để thực hiện so sánh xu hướng.
* Các chỉ số trọng yếu (KPIs):
  * Spread Analysis: Biểu đồ so sánh Giá mua vào bình quân vs. Giá KITCO thế giới (Phát hiện rủi ro thu mua).
  * Loss Variance by Stage: So sánh tỷ lệ hao hụt giữa công đoạn Cán kéo và Cán dát để tìm ra điểm yếu trong quy trình kỹ thuật.
  * Worker Performance Rank: Xếp hạng thợ dựa trên tỷ lệ hao hụt vượt định mức.
* Bộ lọc đa chiều: Theo năm, theo loại vật liệu, theo tổ nhóm thợ.

Phân tích "So What": Việc nhận diện biến động chênh lệch giá (Spread) giúp BOD đưa ra quyết định mua hàng (Procurement) tại các thời điểm giá tốt, giảm thiểu chi phí vốn đầu vào.

Lời kết: Kiến trúc giao diện này không chỉ đơn thuần là công cụ nhập liệu, mà là một hệ thống kiểm soát nội bộ toàn diện. Với việc tích hợp API giá thế giới, tuân thủ nghiêm ngặt các quy định thuế Palladium 13% và minh bạch hóa trạng thái "Treo nợ", ASIANA GOLD sẽ sở hữu một nền tảng quản trị nguyên liệu chính xác, bảo mật và sẵn sàng cho các mục tiêu tăng trưởng năm 2026.
