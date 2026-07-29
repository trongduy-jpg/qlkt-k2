DANH MỤC CẤU TRÚC DỮ LIỆU VÀ ĐỐI TƯỢNG QUẢN TRỊ HỆ THỐNG SẢN XUẤT KIM HOÀN

1. Phân tích Tổng quan về Kiến trúc Dữ liệu Hệ thống

Trong kiến trúc hệ thống quản trị sản xuất kim hoàn (ERP-Jewelry), việc chuẩn hóa các đối tượng dữ liệu là điều kiện tiên quyết để đảm bảo tính toàn vẹn dữ liệu (Data Integrity). Hệ thống được thiết kế dựa trên các lớp Metadata chặt chẽ, cho phép theo dõi vết (Traceability) từ lúc xuất nguyên liệu thô cho đến khi thành phẩm đạt QC. Việc xác định rõ các trường thông tin không chỉ giúp vận hành quy trình mà còn là nền tảng để tự động hóa nghiệp vụ "Quy 99.99" và kiểm soát công nợ thợ thông qua trạng thái chứng từ.

Dưới đây là 05 nhóm đối tượng dữ liệu chính và mối quan hệ thực thể:

Nhóm đối tượng dữ liệu	Vai trò chính	Loại dữ liệu	Ghi chú kiến trúc
1. Nguyên vật liệu	Định danh đặc tính hóa lý	Master Data	Chứa các quy tắc quy đổi tuổi vàng/bạch kim.
2. Nhân sự	Thực thể chịu trách nhiệm	Master Data	Gắn với Mã thợ (PK) và Công đoạn sản xuất.
3. Giá thị trường	Tham số định giá biến động	Master Data	Cập nhật theo phiên (Daily/Monthly).
4. Lệnh sản xuất (LSX)	Thực thể điều phối	Transactional	Kết nối Mã hàng, Nhân sự và Thời hạn.
5. Giao dịch Hao hụt	Nhật ký biến động vật chất	Transactional	Dữ liệu thô để tính toán bồi thường và tài chính.

Mối quan hệ logic: Lệnh sản xuất (LSX) đóng vai trò trung tâm, tham chiếu đến Nguyên vật liệu và Nhân sự. Các Giao dịch Hao hụt phát sinh trong LSX sẽ sử dụng Giá thị trường tại thời điểm chốt sổ để hạch toán tài chính. Tất cả quan hệ này được duy trì qua các khóa ngoại (Foreign Keys) để đảm bảo không có dữ liệu mồ côi.

2. Quản lý Đối tượng Nguyên vật liệu (Material Master Data)

Đối với ngành kim hoàn, Master Data của nguyên vật liệu không chỉ dừng lại ở tên gọi mà phải chi tiết đến hàm lượng hợp kim và cấu trúc thuế phí đặc thù. Điều này cực kỳ quan trọng đối với các dòng như Platinum (PT) vốn có công thức tính giá phức tạp.

Bảng cấu trúc dữ liệu Nguyên vật liệu:

Trường thông tin	Kiểu dữ liệu	Ràng buộc	Ví dụ / Quy tắc logic
Mã NVL (PK)	Varchar(20)	Unique	NL750W, NL416W, NL-PD-PT900
Tên NVL	Nvarchar(100)	Not Null	Nguyên liệu vàng 750 trắng, Bạch kim 900
Loại vật liệu	Enum	Category	Vàng, Bạc, PT, Hội, Bột (Dust)
Hàm lượng (Tuổi)	Decimal(5,2)	0 - 100%	75.00%, 41.60%, 92.50%
Thành phần hợp kim	JSON/Text	Optional	PT900: {PT: 90%, PD: 10%}
Thuế phí đi kèm	Decimal(5,2)	Default 0	13% Tax cho Palladium (PD) trong PT900
Hàm lượng quy đổi	Decimal(5,2)	Formula	Dùng cho nghiệp vụ "Quy 99.99"
Đơn vị tính (ĐVT)	Varchar(10)	Not Null	Gr, Chỉ (1 Lượng = 10 Chỉ)

Phân tích nghiệp vụ "So What?":

* Nghiệp vụ Quy 99.99: Hệ thống sử dụng trường Hàm lượng để quy đổi mọi trọng lượng về vàng nguyên chất. Ví dụ: 1.00 Gr vàng 18K (75%) = 0.75 Gr vàng 99.99.
* Logic PT900: Theo nguồn dữ liệu, giá PT900 không chỉ là giá Platinum. Nó bao gồm: (90% giá PT + 10% giá PD) + 13% Thuế PD. Nếu Metadata không tách bạch các thành phần này, hệ thống sẽ tính sai giá trị bồi thường của thợ khi xảy ra hao hụt Platinum.

3. Quản lý Đối tượng Nhân sự và Công đoạn Sản xuất

Hệ thống cần quản lý nhân sự theo mô hình phân cấp công đoạn để định mức hao hụt chính xác cho từng vị trí thợ (với mã thợ điển hình như TD003 - Lê Văn Tùng).

Bảng cấu trúc dữ liệu Nhân viên (Employee Master):

Trường thông tin	Kiểu dữ liệu	Tham chiếu	Ghi chú
Mã nhân viên (PK)	Varchar(10)	-	TD003, TD004...
Họ và tên	Nvarchar(50)	-	Lê Văn Tùng
Mã công đoạn (FK)	Varchar(10)	ProductionStages	CKE, CDA, DUC...
Ngày vào làm	Date	-	Theo dõi thâm niên để tính định mức
Quản lý trực tiếp	Varchar(10)	EmployeeMaster	Người phê duyệt KCP

Bảng phân loại Công đoạn sản xuất (Production Stages):

Mã công đoạn (PK)	Tên công đoạn	Định mức hao hụt (%)	Mô tả nghiệp vụ
CKE	Cán kéo	Theo kỳ	Kéo nguyên liệu thô thành dây/chỉ
CDA	Cán dát	Theo kỳ	Làm mỏng vật liệu theo yêu cầu kỹ thuật
DUC	Đúc	Theo kỳ	Tạo hình sản phẩm từ khuôn

4. Quản lý Dữ liệu Giá và Tỷ giá Thị trường

Đây là lớp dữ liệu biến động cao, yêu cầu tính chính xác tuyệt đối để phục vụ công tác hậu kiểm (Audit Trail).

Bảng cấu trúc dữ liệu Giá:

Trường thông tin	Kiểu dữ liệu	Nguồn/Quy tắc
Ngày cập nhật (PK)	Date	Ngày ghi nhận giá
Loại kim loại (PK)	Varchar(20)	Vàng, Bạc, PT, PD (Palladium)
Giá niêm yết (USD/OZ)	Decimal(18,4)	KITCO, Daily Metal Price
Tỷ giá USD (VND)	Decimal(18,2)	Vietcombank (VD: 26,395)
Giá quy đổi (VND/Gr)	Decimal(18,2)	(Giá USD/OZ / 31.1) * Tỷ giá USD
Giá quy đổi (VND/Chỉ)	Decimal(18,2)	Giá bình quân mua vào / 10
Người cập nhật	Varchar(20)	User ID thực hiện nhập liệu

Sự khác biệt về ý nghĩa quản trị:

1. Giá vàng bình quân mua vào (Internal Cost): Tính dựa trên các hóa đơn mua thực tế (VD: 154,067,000 VND/Lượng). Đây là căn cứ để trừ nợ thợ, đảm bảo công ty thu hồi đúng chi phí vốn đã bỏ ra.
2. Giá vàng cuối tháng Kitco (Market Value): Dùng để đánh giá lại tài sản tồn kho và chênh lệch vị thế kinh doanh so với thị trường thế giới.

5. Quản lý Lệnh sản xuất và Nhật ký Giao dịch Hao hụt

Đây là lớp dữ liệu giao dịch (Transactional Data) phản ánh thực trạng sản xuất tại xưởng.

Cấu trúc dữ liệu Lệnh sản xuất (LSX):

* Mã LSX (PK): DHAG-26/03/02.
* Mã hàng (FK): BI50416W (Bi 5.0 trơn, 416W).
* Trạng thái: Enum {ĐANG_SX, HOAN_THANH, TREO_NO}.

Chi tiết Nhật ký Hao hụt (Loss Transaction Log):

Trường thông tin	Kiểu dữ liệu	Ví dụ / Ý nghĩa
Ngày phát sinh	Date	02/01/2026
Loại giao dịch	Enum	Xuất cán kéo, Nhập sau cán dát, Xuất bột, Nhập bột cuối tháng
Trọng lượng xuất (Gr)	Decimal(10,3)	Lượng thợ nhận vào
Trọng lượng nhập (Gr)	Decimal(10,3)	Lượng thợ trả về (BTP + Phế liệu)
Trạng thái chứng từ	State Machine	Xác định (Đã đóng) hoặc Treo nợ (Chưa quyết toán)

Nghiệp vụ "Bột" và "Treo nợ": Hệ thống phải ghi nhận riêng các giao dịch "Xuất/Nhập bột" (bụi mịn phát sinh khi chế tác). Đây là loại hao hụt không thể nhìn thấy ngay. Trạng thái "Treo nợ" là một State Machine cực kỳ quan trọng; nếu một chứng từ ở trạng thái này, khoản bồi thường sẽ được chuyển sang kỳ sau, ảnh hưởng trực tiếp đến báo cáo tài chính tháng của thợ.

6. Tổng kết và Khuyến nghị Triển khai Dữ liệu

Để đảm bảo báo cáo "Tổng hợp hao hụt năm" phản ánh chính xác 100% thực trạng, kiến trúc sư dữ liệu cần thực hiện kiểm soát theo checklist sau:

Checklist tính toàn vẹn dữ liệu:

* [ ] Validation Hàm lượng: 100% NVL phải có hàm lượng để thực hiện nghiệp vụ Quy 99.99.
* [ ] Khớp dữ liệu (Data Matching): Tổng trọng lượng xuất = Trọng lượng nhập (Bán thành phẩm + Phế liệu) + Hao hụt thực tế.
* [ ] Logic Chuyển đổi: Đảm bảo hằng số quy đổi đúng (1 Oz = 31.1 Gr; 1 Lượng = 10 Chỉ).
* [ ] Phân quyền Master Data: Chỉ Admin/Kế toán trưởng mới được quyền sửa trường "Định mức hao hụt" và "Giá quy đổi" để tránh gian lận hệ thống.
* [ ] Audit Trail: Mọi thay đổi về giá phải ghi lại User_ID và Timestamp.

Việc chuẩn hóa cấu trúc dữ liệu theo mô hình này sẽ giúp doanh nghiệp không chỉ dừng lại ở việc ghi chép mà còn tiến tới phân tích dự báo hao hụt, tối ưu hóa lợi nhuận trong từng công đoạn chế tác.
