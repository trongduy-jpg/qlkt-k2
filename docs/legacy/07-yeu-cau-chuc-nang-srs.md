TÀI LIỆU YÊU CẦU CHỨC NĂNG (SRS): HỆ THỐNG QUẢN LÝ GIÁ VÀ HAO HỤT NGUYÊN VẬT LIỆU

1. TỔNG QUAN HỆ THỐNG VÀ CHIẾN LƯỢC QUẢN TRỊ

Hệ thống Quản lý Giá và Hao hụt Nguyên vật liệu (NVL) tại ASIANA GOLD được thiết kế nhằm mục tiêu tối thượng là bảo vệ biên lợi nhuận và minh bạch hóa toàn bộ chu trình luân chuyển giá trị trong sản xuất kim hoàn. Trong đặc thù ngành, các biến động nhỏ về tỷ giá hoặc sai số trong định mức hao hụt có thể dẫn đến thất thoát tài chính lớn. Do đó, việc tự động hóa tính toán dựa trên dữ liệu thực tế từ các biểu mẫu nghiệp vụ là yêu cầu cấp thiết.

Hệ thống thiết lập mối liên kết dữ liệu chặt chẽ giữa Bảng duyệt giá (C3107) và Báo cáo tổng hợp hao hụt (C3114). Đây là "lớp xương sống" kỹ thuật đảm bảo tính chính xác tuyệt đối cho khâu quyết toán công nợ thợ. Bằng cách số hóa nhật ký sản xuất và áp dụng các biểu giá phê duyệt theo kỳ, hệ thống chuyển đổi các dòng chảy vật chất thô thành các chỉ số tài chính rõ ràng, giúp Ban Giám đốc kiểm soát chặt chẽ rủi ro và đánh giá năng suất chế tác một cách công bằng.

2. MODULE 1: QUẢN LÝ DANH MỤC VÀ CẤU HÌNH GIÁ NVL (PRICING DATA)

Module này đóng vai trò là "Sự thật duy nhất" (Single Source of Truth), quản lý toàn bộ tham số tài chính đầu vào từ nguồn dữ liệu mua thực tế (KT409(L3)-AGVN) và niêm yết quốc tế.

* Mục đích: Thiết lập biểu giá chuẩn theo kỳ thực hiện (tháng/năm) để làm căn cứ tính bồi thường hao hụt.
* Chức năng chính:
  * Cập nhật & Tính toán Giá Vàng: Ghi nhận giá mua vào theo ngày; hệ thống phải tự động tính toán Giá vàng bình quân và Giá quy đổi (VND/chỉ) cho từng kỳ báo cáo.
  * Đồng bộ Giá Quốc tế: Kết nối dữ liệu từ KITCO và DailyMetalPrice cho các loại NVL: PT, Bạc, Palladium (PD).
  * Cấu hình Giá Hợp kim (PT900): Hệ thống phải cho phép cấu hình linh hoạt công thức tính giá Bạch kim 900.
    * Công thức chuẩn: Giá PT900 = (Giá PT * 90%) + (Giá PD * 10%) + (Giá PD * 10% * Thuế PD).
    * Lưu ý: Thuế Palladium mặc định là 13% (có thể cấu hình lại).
  * Tính năng So sánh: Hệ thống phải tự động kết xuất bảng so sánh giữa "Giá mua bình quân của công ty" và "Giá chốt Kitco cuối tháng" để đánh giá hiệu quả thu mua.
* Dữ liệu nhập: Ngày mua, Giá vàng mua vào (VND/lượng), Giá USD (Tỷ giá Vietcombank), Giá niêm yết quốc tế (Oz).
* Dữ liệu xuất: Bảng trình duyệt giá tính hao hụt hàng tháng (Mẫu C3107), Bảng so sánh biến động giá.
* Business Rules (Quy tắc nghiệp vụ):
  * Đơn vị quy đổi chuẩn: 1 Oz = 31.1 Gram.
  * Hệ thống phải duy trì lịch sử biến động giá để phục vụ việc truy vấn dữ liệu quyết toán của các kỳ quá khứ.
* Quyền hạn: KT NVL nhập liệu; Ban Giám đốc (BGĐ) phê duyệt biểu giá trước khi áp dụng cho Module quyết toán.

3. MODULE 2: QUẢN LÝ NHẬT KÝ SẢN XUẤT VÀ HAO HỤT CÔNG ĐOẠN (PRODUCTION LOG)

Module này thực hiện giám sát dòng chảy vật chất từ khâu KCP (Kiểm tra chất lượng) đến từng thợ chế tác, đảm bảo mọi gram nguyên vật liệu đều được định danh và theo dõi trạng thái nợ.

* Mục đích: Ghi nhận biến động trọng lượng xuất/nhập thực tế để xác định hao hụt theo từng lệnh sản xuất (LSX).
* Chức năng chính:
  * Ghi nhận Nhật ký Sản xuất: Theo dõi chi tiết theo từng dòng giao dịch xuất/nhập NVL.
  * Quản lý Trạng thái Nợ:
    * Xác định: Chốt công nợ trong kỳ báo cáo hiện tại.
    * Treo nợ: Áp dụng cho các sản phẩm chưa hoàn thành (đặc biệt là PT900-PD và Bạc 92.5). Hệ thống phải hỗ trợ logic kết chuyển nợ sang kỳ kế tiếp và tự động chuyển sang trạng thái "Xác định" khi LSX hoàn tất.
  * Logic Đối trừ Bột (Returned Powder): Ghi nhận các giao dịch "Nhập bột cuối tháng" để giảm trừ công nợ thợ.
* Dữ liệu nhập: Ngày phát sinh, Lệnh sản xuất (LSX), Mã hàng (SKU), Tên thợ, Loại vàng (10K, 14K, 17K, 18K...), Trọng lượng Xuất, Trọng lượng Nhập, Sản phẩm hoàn thành (SPHT) đạt QC, Hàng lỗi (Gr), Công đoạn (Cán kéo, Cán dát, Xuất bột...).
* Dữ liệu xuất: Bảng chi tiết hao hụt theo từng nhân viên (Mẫu C3114), Báo cáo NVL kết chuyển (Treo nợ).
* Business Rules:
  * Công thức tính nợ cuối kỳ: Hao hụt thực tế = (Tổng Xuất - Tổng Nhập) - Tổng Bột hoàn trả.
  * Độ chính xác: Toàn bộ dữ liệu trọng lượng (Gram) phải được ghi nhận và tính toán với 04 chữ số thập phân.
* Quyền hạn: KCP/Tổ trưởng nhập liệu; Thợ chế tác tra cứu lịch sử và trạng thái nợ cá nhân.

4. MODULE 3: TỔNG HỢP KẾT QUẢ VÀ QUYẾT TOÁN BỒI THƯỜNG (COMPENSATION & REPORTING)

Module này đóng vai trò chuyển hóa các dữ liệu sản xuất thô thành giá trị tài chính và thực hiện nghĩa vụ bồi thường nếu có thất thoát vượt định mức.

* Mục đích: Tính toán giá trị tiền tệ của hao hụt vượt định mức và tổng hợp báo cáo năng suất phòng sản xuất.
* Chức năng chính:
  * Quy đổi Vàng chuẩn: Hệ thống phải thực hiện quy đổi trọng lượng từ các tuổi vàng khác nhau về Vàng 24K (99.99%) trước khi tính giá trị.
    * Tỷ lệ quy đổi chuẩn: 18K (75%), 17K (70.8%), 10K (41.6%).
  * Tính toán Bồi thường: Tự động áp biểu giá đã được BGĐ phê duyệt từ Module 1 để tính "Thành tiền".
  * Tổng hợp Báo cáo PK: Kết xuất báo cáo kết quả thực hiện của Phòng Kỹ thuật/Sản xuất.
* Dữ liệu nhập: Tỷ lệ hao hụt định mức (%) theo từng công đoạn/loại hàng, Tuổi vàng thực tế.
* Dữ liệu xuất: Phiếu bồi thường hao hụt thợ (hiển thị: Tổng hao hụt, Trọng lượng quy 99.99, ĐVT Chỉ, Thành tiền VND), Báo cáo tổng hợp PK.
* Business Rules:
  * Điều kiện bồi thường: Chỉ phát sinh giá trị bồi thường khi Hao hụt thực tế > Hao hụt định mức.
  * Định dạng tài chính: "Thành tiền" phải được hiển thị dưới định dạng tiền tệ VND, có dấu phân cách hàng nghìn.
  * Làm tròn: Làm tròn kết quả tiền tệ cuối cùng theo tiêu chuẩn kế toán hiện hành.
* Quyền hạn: Kế toán tổng hợp thực hiện; BGĐ phê duyệt báo cáo cuối cùng.

5. PHÂN QUYỀN VÀ ĐIỀU KIỆN BẢO MẬT HỆ THỐNG

Để đảm bảo tính toàn vẹn của dữ liệu và bảo mật thông tin tài chính nội bộ, hệ thống áp dụng ma trận phân quyền sau:

Nhóm quyền	Module 1: Giá NVL	Module 2: Nhật ký SX	Module 3: Quyết toán	Phê duyệt Báo cáo
Ban Giám đốc	Xem	Xem	Xem	Có
Kế toán NVL	Thêm, Sửa, Xóa	Xem	Xem	Không
Kế toán Tổng hợp	Xem	Xem	Thêm, Sửa, Xóa	Không
Nhân viên KCP	Không	Thêm, Sửa	Không	Không
Tổ trưởng sản xuất	Không	Xem	Không	Không
Thợ chế tác	Không	Xem (Cá nhân)	Xem (Cá nhân)	Không

Điều kiện bảo mật và toàn vẹn dữ liệu:

1. Chốt dữ liệu: Hệ thống phải khóa toàn bộ chức năng Thêm/Sửa/Xóa đối với các bản ghi đã được Ban Giám đốc phê duyệt trong tháng báo cáo.
2. Audit Trail: Mọi thao tác thay đổi giá vàng, thay đổi trọng lượng xuất/nhập sau khi đã lưu bản nháp phải được hệ thống ghi lại nhật ký (Người thay đổi, Thời gian, Giá trị cũ, Giá trị mới).
3. Tính toàn vẹn: Hệ thống phải thực hiện kiểm tra tính logic (Validation) để ngăn chặn việc nhập trọng lượng nhập lớn hơn trọng lượng xuất trong cùng một lệnh sản xuất nếu không có lý do nghiệp vụ đặc thù.

Dữ liệu khi vận hành đồng bộ theo quy trình trên sẽ đảm bảo tính nhất quán từ khâu nhập kho nguyên liệu đến khi quyết toán tài chính, tạo nền tảng vững chắc cho công tác quản trị tại ASIANA GOLD.
