BÁO CÁO TỔNG HỢP YÊU CẦU NÂNG CẤP HỆ THỐNG WEBAPP QUẢN LÝ SẢN XUẤT
1. Tổng quan chiến lược và Mục tiêu nâng cấp
Dự án chuyển đổi từ quản lý thủ công trên Google Sheets sang hệ thống Webapp chuyên biệt là bước đi chiến lược nhằm chuẩn hóa toàn bộ dữ liệu vận hành. Trong ngành sản xuất kim hoàn, việc số hóa không chỉ đơn thuần là thay đổi công cụ nhập liệu mà là thiết lập một cơ chế kiểm soát chặt chẽ dòng chảy kim loại quý, từ khâu khởi tạo lệnh sản xuất đến báo cáo hao hụt chi tiết.
Tính chính xác trong ghi nhận nghiệp vụ là yếu tố sống còn để minh bạch hóa trách nhiệm của thợ và tối ưu hóa lợi nhuận. Hệ thống mới sẽ giải quyết triệt để các rủi ro về sai lệch dữ liệu, hỗ trợ nhà quản lý đưa ra quyết định dựa trên số liệu thực tế theo thời gian thực.
2. Yêu cầu kỹ thuật đối với Module Lệnh Sản xuất (Production Orders)
Module Lệnh sản xuất là điểm khởi phát của mọi dữ liệu trong hệ thống. Mọi thông tin tại đây sẽ được kế thừa cho các bước nhật ký nguyên vật liệu và kiểm soát kho thợ.
Cấu trúc dữ liệu và Quy tắc định danh
Trường thông tin
Loại dữ liệu
Quy tắc logic & Yêu cầu kỹ thuật
Mã lệnh sản xuất
Dropdown + Hệ thống sinh
Định dạng: [Mã cố định từ Dropdown] + [YYMMDD].
Mã hàng
Nhập tay/Dropdown
Cho phép nhập tay với mã mới; ưu tiên chọn từ danh mục có sẵn.
Tên hàng / Diễn giải
Nhập tay
Hiển thị đi kèm mã hàng để hỗ trợ nhận diện sản phẩm.
Số lượng
Số (Integer)
Ghi nhận số lượng sản phẩm/sợi/viên theo đơn hàng.
Nơi nhận
Dropdown
Danh sách các bộ phận hoặc cá nhân tiếp nhận lệnh.
Nguyên tắc quản trị: Hệ thống phải phân biệt rõ "Mã lệnh sản xuất" (định danh cho một lệnh cụ thể theo ngày) và "Mã hàng" (định danh chủng loại sản phẩm) để đảm bảo tính nhất quán trong việc truy xuất lịch sử sản xuất.
3. Quản lý Nhật ký Nguyên vật liệu và Quy trình Công đoạn
Nhật ký nguyên vật liệu là trung tâm kiểm soát mọi biến động "vào - ra" của kim loại quý. Form nhập liệu cần được thiết kế để hạn chế sai sót từ phía người dùng.
Quy tắc thiết kế và Logic nghiệp vụ
Cấu trúc Số chứng từ (Số CT): Tự động sinh theo định dạng [YYYYMMDD] + [Số thứ tự lũy tiến].
Danh mục Công đoạn:
Loại bỏ công đoạn "Đúc" và trường dữ liệu "Bột phụ" (flux) theo yêu cầu thực tế.
Gộp công đoạn "Cán" và "Kéo" thành một công đoạn duy nhất: "Cán kéo".
Đơn vị tính & Giới hạn: Đơn vị chuẩn là Gram (g). Thiết lập cảnh báo hoặc giới hạn cho các nghiệp vụ thông thường trên 2000g.
Trạng thái Giao dịch & Tính hao:
Đang xử lý: Nguyên liệu đang nằm trong công đoạn chế tác.
Đã chốt: Hoàn thành công đoạn, dữ liệu được khóa để bảo mật.
Treo nợ: Hao hụt tính vào chi phí công ty (không trừ thợ).
Xác định: Tính tiền hao hụt trực tiếp cho thợ. Bắt buộc áp dụng cho 03 công đoạn: Cán kéo, Đan, và Biến.
Logic xử lý gối đầu (Carry-over Logic): Phân biệt rõ "Tháng tính nhập xuất tồn" (ghi nhận theo thời gian thực tế phát sinh giao dịch) và "Tháng tính hao". Nếu thợ nhận nguyên liệu vào cuối tháng (ví dụ ngày 28) nhưng chưa hoàn thành, nghiệp vụ tính hao sẽ được dời sang tháng kế tiếp để đảm bảo tính hao hụt trọn vẹn trên một đơn hàng hoàn chỉnh.
4. Hệ thống Định mức và Cơ chế Quy đổi Nguyên liệu
Yêu cầu kỹ thuật đối với module này là tạo ra một thước đo chung cho tất cả các loại nguyên liệu có hàm lượng khác nhau.
Quản lý nguyên liệu và Công thức tính toán
Danh mục nguyên liệu: Vàng (24k, 18k, 14k...), Bạc, Platinum.
Nguồn nhập: Bổ sung các tùy chọn Dropdown cụ thể như "Phân kim" và "Nhập từ US".
Cơ chế cập nhật giá: Hệ thống hỗ trợ cập nhật thủ công theo Link định mức hoặc tự động quét giá từ website nguồn vào ngày cuối tháng.
Logic quy đổi Vàng 24k: Mọi loại vàng phải được quy đổi về giá trị 24k tương đương để đồng nhất báo cáo.
Công thức: Trọng lượng thực tế x Purity (Hàm lượng) / 999 (hoặc 100%).
Ví dụ: 10g vàng 18k (75%) quy đổi = 10 x 0.75 = 7.5g vàng 24k.
5. Kiểm soát Tồn kho Thợ và Quản trị Rủi ro
Hệ thống phải cung cấp cái nhìn minh bạch về số dư nguyên liệu mà mỗi người thợ đang chịu trách nhiệm.
Nguyên tắc quản trị rủi ro tồn kho
Công thức tồn sổ sách: [Tồn đầu kỳ] + [Nhập của thợ] - [Xuất của thợ] = [Tồn sổ sách].
Đối soát thực tế: Sử dụng trường Tồn thực tế (nhập tay) để đối chiếu với số dư trên hệ thống.
Ngưỡng an toàn (Ký quỹ):
Sai lệch < 5g: Trạng thái "An toàn".
Sai lệch > 5g: Trạng thái "Rủi ro".
Trạng thái "Đang kiểm soát": Áp dụng đặc thù cho các công đoạn Bào dây và Pi. Tại các khâu này, nguyên liệu còn bám trên máy móc chưa thu hồi hết, do đó hệ thống không gắn nhãn "Rủi ro" ngay cả khi có sai lệch trên 5g.
6. Hệ thống Dashboard và Hiển thị Báo cáo
Giao diện hiển thị (Mặt tiền) cần ưu tiên các thông tin giúp nhà quản lý nhận diện nhanh trạng thái sản xuất.
Yêu cầu hiển thị và Bộ lọc
Ưu tiên hiển thị danh sách: Thứ tự các cột quan trọng bao gồm: Số chứng từ -> Mã hàng -> Mã lệnh sản xuất -> Loại nguyên liệu -> Trạng thái tính hao. (Mã hàng phải xuất hiện trước thông tin nguyên liệu).
Bộ lọc đa năng:
Lọc theo "Ngày nghiệp vụ" để kiểm soát phát sinh trong ngày.
Lọc theo "Tháng tính hao/tồn" để phục vụ quyết toán tháng.
Lọc theo trạng thái tính hao (Treo nợ/Xác định).
Cấu trúc báo cáo hao hụt: Hệ thống không chỉ báo cáo theo lệnh riêng lẻ mà phải tổng hợp được hao hụt theo Công đoạn và Loại vàng (18k, 24k...) để đánh giá hiệu quả của từng tổ sản xuất.
7. Kết luận và Lộ trình Triển khai Demo
Bản demo đầu tiên sẽ tập trung hoàn thiện luồng dữ liệu từ Lệnh sản xuất đến Nhật ký và Bảng tồn kho thợ.
Các công việc ưu tiên:
Xác nhận Dropdown: Gửi danh mục mã lệnh, nguồn nhập (Phân kim, Nhập từ US) và loại nguyên liệu cho người dùng cuối xác nhận.
Thiết lập Logic: Cài đặt công thức quy đổi 24k và cơ chế chuyển tháng tính hao cho các đơn hàng gối đầu.
Hiệu chỉnh UI: Tối ưu hóa giao diện danh sách theo thứ tự ưu tiên các trường thông tin đã quy định.
Mọi tính năng sẽ được tinh chỉnh thông qua các buổi họp hiệu chỉnh định kỳ để đảm bảo hệ thống phản ánh chính xác quy trình vận hành đặc thù của xưởng.