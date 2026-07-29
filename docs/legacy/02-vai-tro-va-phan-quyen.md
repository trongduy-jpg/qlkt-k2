PHÂN TÍCH HỆ THỐNG VAI TRÒ VÀ QUYỀN HẠN TRONG QUY TRÌNH QUẢN LÝ HAO HỤT SẢN XUẤT

1. Tổng quan về Hệ thống và Bối cảnh Nghiệp vụ

Hệ thống quản lý hao hụt tại ASIANA GOLD là một kiến trúc kiểm soát dữ liệu khép kín, được thiết kế để minh bạch hóa dòng chảy tài sản từ khâu thu mua nguyên vật liệu (NVL), định giá tài chính cho đến chi tiết thực thi tại từng bàn thợ. Dựa trên dữ liệu từ các tài liệu nghiệp vụ trọng yếu như "Đề xuất duyệt giá tính hao" và "Báo cáo tổng hợp hao hụt", hệ thống này không chỉ đơn thuần là công cụ kế toán mà là cơ chế bảo toàn giá trị chiến lược cho các kim loại quý (Vàng, Bạc, Bạch kim - PT).

Mục tiêu cốt lõi của hệ thống là thiết lập một "điểm tin cậy duy nhất" (Single Source of Truth), nơi dữ liệu từ thị trường thế giới được chuẩn hóa thành giá trị công nợ nội bộ, đảm bảo tính công bằng trong việc tính bồi thường hao hụt vượt định mức. Việc phân định vai trò rõ ràng giúp duy trì tính toàn vẹn của dữ liệu (Data Integrity) và thiết lập vết kiểm toán (Audit Trail) xuyên suốt chuỗi giá trị sản xuất.

2. Nhóm Vai trò Quản trị và Phê duyệt (Management & Approval)

Trong cấu trúc ERP, nhóm quản trị đóng vai trò thiết lập các tham số tài chính làm nền tảng (Master Data) cho toàn bộ kỳ thực hiện.

* Vai trò: Ban Giám đốc (BGĐ) / Người phê duyệt (Đại diện: Chị Hạnh)
  * Trách nhiệm: Quyết định và phê chuẩn đơn giá quy đổi NVL để tính công nợ hao hụt cho thợ. BGĐ đảm bảo rằng mức giá áp dụng phản ánh đúng biến động thị trường nhưng vẫn bảo vệ được biên lợi nhuận của doanh nghiệp.
  * Dữ liệu xem xét: Bảng trình duyệt giá tính hao hụt hàng tháng, Bảng so sánh chênh lệch giữa giá mua vào thực tế của công ty và giá thế giới (KITCO), cùng tỷ giá ngoại tệ từ Vietcombank.
  * Thao tác hệ thống: Xem xét các tờ trình từ phòng kế toán và thực hiện tác vụ "Duyệt giá" trên hệ thống để kích hoạt bộ tham số tính toán cho kỳ thực hiện.
  * Quyền hạn: Quyền cao nhất trong việc chốt dữ liệu tài chính (Data Freezing). Sau khi BGĐ duyệt, đơn giá trong kỳ sẽ không thể thay đổi bởi các cấp dưới.

Sự phê chuẩn của BGĐ là căn cứ pháp lý để chuyển đổi các con số kỹ thuật từ xưởng sản xuất thành giá trị bồi thường tài chính, đảm bảo nguyên tắc bất kiêm nhiệm giữa người lập biểu và người phê duyệt.

3. Nhóm Vai trò Nghiệp vụ Kế toán và Kiểm soát (Accounting & Control)

Bộ phận kế toán đóng vai trò là "xương sống" logic, chịu trách nhiệm kết nối dữ liệu thô từ thị trường và hiện trường sản xuất.

* Kế toán Nguyên vật liệu (KT NVL) – (Đại diện: Bùi Chí Phát / Nguyễn Thị Thanh Hằng):
  * Trách nhiệm: Theo dõi biến động giá thị trường và lập bảng đề xuất giá hàng tháng.
  * Dữ liệu xem xét: Sử dụng Bảng theo dõi mua NVL [C109] làm căn cứ gốc cho chi phí nội bộ, kết hợp dữ liệu KITCO, dailymetalprice.com và tỷ giá Vietcombank.
  * Thông số kỹ thuật: Thực hiện quy đổi Oz sang đơn vị sản xuất (1 Oz = 31.1 Gram). Tính toán giá quy đổi VND/Chỉ bằng cách lấy đơn giá VND/Lượng chia cho 10.
  * Công thức tính PT900: Áp dụng logic kỹ thuật đặc thù: $ \text{Tổng giá PT900} = (90% \times \text{Giá PT}) + (10% \times \text{Giá PD}) + (13% \text{ Thuế PD}) $.
  * Quyền hạn: Khởi tạo và chỉnh sửa các bảng đề xuất giá tính hao.
* Kế toán Tổng hợp (KTTH) & Người lập biểu – (Đại diện: Nguyễn Thị Bích Nga / Huỳnh Hoài Phong):
  * Trách nhiệm: Tổng hợp dữ liệu hao hụt từ các công đoạn (Cán kéo, cán dát) để lập báo cáo bồi thường.
  * Dữ liệu hệ thống: Sử dụng Lệnh sản xuất (LSX) và Mã hàng làm mã khóa chính (Primary Keys) để truy xuất dữ liệu từ KCP.
  * Thao tác: Kết chuyển dữ liệu NVL, tính toán số tiền bồi thường dựa trên chênh lệch giữa trọng lượng xuất/nhập thực tế của từng thợ (như thợ Lê Văn Tùng) sau khi đã trừ định mức cho phép.
  * Quyền hạn: Truy cập toàn bộ dữ liệu hao hụt các công đoạn và ký xác nhận báo cáo tổng hợp để trình BGĐ.

4. Nhóm Vai trò Sản xuất và Giám sát Hiện trường (Operational & Supervision)

Tính chính xác của hệ thống phụ thuộc hoàn toàn vào dữ liệu đầu vào tại hiện trường, nơi các giao dịch vật lý diễn ra.

* Thợ/Nhân viên Sản xuất (Vd: Thợ Cán kéo - Lê Văn Tùng):
  * Trách nhiệm: Thực hiện gia công theo LSX, đảm bảo tỷ lệ hao hụt nằm trong định mức kỹ thuật.
  * Tác vụ hệ thống: Xác nhận trọng lượng thực nhận từ kho (Xuất cán kéo) và trọng lượng bàn giao sản phẩm hoặc bột thu hồi (Nhập sau cán kéo).
  * Quyền hạn: Xác nhận số liệu trên phiếu cân để làm căn cứ chốt công nợ cá nhân.
* Bộ phận Kiểm soát Chất lượng (KCP) & Giám sát Nội bộ (GSNB) – (Đại diện: Ma Thị Mỹ Trân):
  * Trách nhiệm: Kiểm soát trọng lượng và tình trạng QC của hàng hóa luân chuyển. GSNB đóng vai trò đối soát chéo độc lập để ngăn ngừa gian lận giữa thợ và nhân viên cân.
  * Logic trạng thái dữ liệu:
    * "Xác định": Áp dụng cho các lệnh đã hoàn tất bàn giao SPHT, đủ điều kiện chốt hao hụt.
    * "Treo nợ": Áp dụng cho các trường hợp đặc thù như Bạc hoặc PT trong quá trình TEST HỘI, hoặc các vật tư chưa kết thúc chu kỳ thử nghiệm.
  * Tác vụ then chốt: Thực hiện "Nhập bột cuối tháng" để chốt chặn dữ liệu vật tư thu hồi, ngăn chặn việc thợ chuyển dịch hao hụt giữa các kỳ.
  * Quyền hạn: Từ chối nhận hàng không đạt QC, chốt số liệu trọng lượng thực tế trên hệ thống.

5. Ma trận Phân quyền và Quyền hạn Hệ thống (System Permissions Matrix)

Kiến trúc phân quyền tại ASIANA GOLD tuân thủ nghiêm ngặt nguyên tắc "Phân chia trách nhiệm" (Segregation of Duties) nhằm triệt tiêu rủi ro thao túng giá trị tài chính.

Vai trò	Người phụ trách tiêu biểu	Xem (Read)	Ghi (Write)	Phê duyệt (Approve)	Market Data	Quyền sở hữu nguồn dữ liệu (Data Ownership)
Ban Giám đốc	Chị Hạnh	Toàn bộ	Không	Có	Có	Đơn giá tính hao (Approved Price)
Kế toán NVL	Bùi Chí Phát	Toàn bộ	Bảng đề xuất giá	Không	Có	Giá mua thực tế & Tỷ giá quy đổi
Kế toán Tổng hợp	Nguyễn Thị Bích Nga	Toàn bộ	Báo cáo hao hụt	Có	Có	Công nợ bồi thường (Liability)
GSNB	Ma Thị Mỹ Trân	Toàn bộ	Không	Không	Không	Đối soát chéo & Kiểm toán vết
KCP/KCS	Nhóm Kiểm soát	LSX/Kho	Trọng lượng cân	Không	Không	Trọng lượng thực tế (Physical Weight)
Thợ Sản xuất	Lê Văn Tùng	Cá nhân	Không	Không	Không	Xác nhận giao dịch hiện trường

Phân tích logic hệ thống (So What?): Cơ cấu này giải quyết rủi ro biến động giá vàng (Volatility Risk). Bằng cách áp dụng "Kỳ thực hiện" (Implementation Period) với mức giá bình quân được duyệt cố định, hệ thống ngăn chặn việc thợ "canh thời điểm" (market timing) để bàn giao sản phẩm vào những ngày giá thấp nhằm giảm tiền bồi thường.

Việc tách biệt tuyệt đối giữa người "nắm giữ trọng lượng" (KCP) và người "nắm giữ đơn giá" (KT NVL) tạo ra một cơ chế đối trọng tự động. Hệ thống ERP đóng vai trò là trọng tài, tự động tính toán bồi thường dựa trên hai nguồn dữ liệu độc lập này sau khi tác vụ "Nhập bột cuối tháng" được GSNB xác nhận hoàn tất, đảm bảo tính toàn vẹn và minh bạch tuyệt đối cho ASIANA GOLD.
