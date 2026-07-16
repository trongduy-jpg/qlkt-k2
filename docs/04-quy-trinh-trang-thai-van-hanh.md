HƯỚNG DẪN QUY TRÌNH QUẢN LÝ TRẠNG THÁI VẬN HÀNH: TỪ NGUYÊN VẬT LIỆU ĐẾN SẢN XUẤT THÀNH PHẨM

1. Tổng quan về Hệ thống Quản trị Trạng thái và Tầm quan trọng Chiến lược

Tại Asiana Gold, việc quản trị các dòng kim loại quý (Vàng, Bạc 92.5, Platinum PT900) không chỉ dừng lại ở việc ghi chép số liệu mà là thiết lập các Internal Control Points (Điểm kiểm soát nội bộ) để bảo vệ tài sản chiến lược. Hệ thống quản trị trạng thái được thiết kế nhằm tạo ra một Audit Trail (Vết kiểm toán) xuyên suốt từ khi nguyên liệu nhập kho cho đến khi thành phẩm đạt QC.

Việc minh bạch hóa dữ liệu trạng thái là yếu tố sống còn để phối hợp giữa phòng Kế toán, GSNB (Giám sát nội bộ), KCP và xưởng sản xuất. Nếu không chuẩn hóa trạng thái, rủi ro thất thoát vật chất và sai lệch báo cáo tài chính là không thể tránh khỏi. Dưới đây là khung vận hành chuẩn dựa trên các lớp dữ liệu thực tế tại hệ thống.

2. Quản lý Trạng thái Nguyên vật liệu (NVL) và Phê duyệt Giá tính hao

Đặc thù của ngành kim hoàn là tính biến động cực cao của giá nguyên liệu. Do đó, việc xác lập trạng thái giá là bước khởi đầu để định vị giá trị tài sản và xác định trách nhiệm tài chính của thợ.

Bảng tổng hợp các trạng thái phê duyệt giá

Trạng thái	Ý nghĩa Chiến lược	Điều kiện chuyển trạng thái	Người cập nhật
Đề xuất (Proposed)	Thiết lập cơ sở giá dựa trên giá bình quân mua vào và biến động Kitco.	Thực hiện cuối kỳ hoặc khi phát sinh giao dịch mới (Ví dụ: Tháng 05/2026).	Kế toán NVL (Bùi Chí Phát/Nguyễn Thị Thanh Hằng).
Đã duyệt (Approved)	Xác lập giá chính thức để áp công nợ bồi thường cho thợ.	Chữ ký phê duyệt của BGĐ (Chị Hạnh).	Ban Giám đốc.

Phân tích "So what?": Tại sao phải chốt giá đúng hạn? Ví dụ, giá quy đổi Vàng 24K tháng 05/2026 được xác định là 15,407,000 VND/chỉ. Nếu trạng thái "Đã duyệt" bị chậm trễ, hệ thống sẽ không thể tính toán được số tiền Bồi thường (Compensation) thực tế đối với các thợ vượt định mức hao hụt. Điều này gây tắc nghẽn toàn bộ báo cáo tài chính và kỷ luật vận hành tại xưởng.

3. Trạng thái Yêu cầu Mua hàng và Đơn hàng (Purchase Requests & Orders)

Dòng chảy cung ứng bắt đầu từ các giao dịch mua ngoài được ghi nhận tại mã tài liệu [KT409(L3)-AGVN][C109].

1. Trạng thái "Đang giao dịch/Mua vào": Theo dõi khối lượng thực tế nhập về theo các mốc thời gian (Ví dụ: Đợt mua ngày 06/05 giá 154,000,000 VND/lượng).
2. Trạng thái "Đã quy đổi": Đây là bước chuyển hóa từ dữ liệu thị trường sang đơn vị sản xuất.
  * Công thức chuẩn: 1 Oz = 31.1 grams.
  * Nghiệp vụ: Chuyển đổi từ Lượng/Oz sang Chỉ/Gr để sẵn sàng cấp phát. Đối với các hợp kim phức tạp như PT900 (90% PT + 10% PD), trạng thái này yêu cầu tính toán thêm tỷ trọng Palladium và thuế liên quan để ra giá quy đổi chuẩn (Ví dụ: 6,068,000 VND/chỉ cho PT).

4. Quản lý Trạng thái Nhập kho và Cấp phát (Warehousing & Allocation)

Kho vận hành như một "chốt chặn" kiểm soát rủi ro tài sản. Mọi biến động phải được xác nhận bởi các bên độc lập để đảm bảo tính khách quan.

* Trạng thái "Kết chuyển tháng trước": Do Kế toán tổng hợp (Nguyễn Thị Bích Nga) xác nhận số dư NVL chưa sử dụng hết từ kỳ trước.
* Trạng thái "KCP Xuất thợ": Ghi nhận bàn giao vật chất cho sản xuất.
  * Điều kiện: Phải đính kèm Lệnh sản xuất (Ví dụ: DHAG-26/03/02) và tên thợ cụ thể.
  * Kiểm soát: Giám sát nội bộ (Ma Thị Mỹ Trân) thực hiện hậu kiểm để đảm bảo lượng xuất kho khớp với định mức sản xuất.

Giá trị quản trị: Việc tách biệt trạng thái "Trong kho" và "Đang ở thợ" cho phép BGĐ truy xuất ngay lập tức vị trí của tài sản tại bất kỳ thời điểm nào, từ đó quy trách nhiệm bảo quản cụ thể cho từng cá nhân.

5. Theo dõi Trạng thái Công đoạn Sản xuất (Production Workflow)

Quy trình tại xưởng (Cán kéo, cán dát) được theo dõi qua nhật ký sản xuất để kiểm soát hao hụt theo thời gian thực.

Ví dụ điển hình: Thợ Lê Văn Tùng (Mã NV: TD003)

Trạng thái	Ý nghĩa vận hành	Dữ liệu kiểm soát (Audit Trail)
Xuất cán kéo	Bắt đầu sơ chế NVL.	Xuất 23.00g Vàng 18K (NL750W).
Nhập sau cán kéo	Hoàn thành công đoạn.	Nhập về 22.89g bán thành phẩm.
Nhập bột cuối tháng	Thu hồi bụi vàng/phế liệu.	Thu hồi bột (Ví dụ: 0.86g bột 18K) để đối soát tổng hao hụt.

So sánh Đầu vào - Đầu ra: Sự chênh lệch giữa 23.00g xuất và 22.89g nhập (0.11g) sẽ được hệ thống phân loại trạng thái để xử lý tài chính.

6. Trạng thái Kết thúc và Quyết toán Hao hụt (Loss Settlement)

Đây là điểm cuối của chu kỳ quản trị trạng thái, nơi xác định nghĩa vụ tài chính cuối cùng.

* Trạng thái "Xác định": Áp dụng khi hao hụt nằm trong định mức (Quota) hoặc sai lệch đã được giải trình thỏa đáng. Các lệnh sản xuất như DHAG-26/03/02 của Lê Văn Tùng thường được chốt ở trạng thái này sau khi KCP kiểm tra đạt QC.
* Trạng thái "Treo nợ": Áp dụng cho các trường hợp hao hụt vượt định mức hoặc các nguyên vật liệu khó kiểm soát như PT900-PD và Bạc 92.5.
  * Đặc thù: Platinum (PT) thường bị treo nợ lâu hơn do quy trình thu hồi bột và phân tách hội phức tạp.
  * Hệ quả: Khi một khoản được xác định là "Treo nợ", kế toán sẽ tính toán số tiền bồi thường. Ví dụ: Thợ Lê Văn Tùng phát sinh số tiền bồi thường 2,033,927 VND cho phần hao hụt vượt mức trong kỳ tháng 06/2026.

Tầm quan trọng: Nếu trạng thái "Treo nợ" không được xử lý dứt điểm, nó sẽ tạo ra những "lỗ hổng" trên bảng cân đối kế toán và làm suy yếu kỷ luật sản xuất.

7. Kết luận và Khuyến nghị Quản trị

Hệ thống quản trị trạng thái tại Asiana Gold là một vòng lặp kín từ Giá -> Kho -> Sản xuất -> Quyết toán. Tính trung thực của dữ liệu phụ thuộc hoàn toàn vào việc cập nhật trạng thái kịp thời tại mỗi mắt xích.

Khuyến nghị thực thi:

1. Ban Giám đốc: Đảm bảo phê duyệt giá định kỳ (Ví dụ: giá 15.4M tháng 5) đúng ngày 01 hàng tháng để không làm gián đoạn việc tính toán công nợ.
2. Kế toán & KCP: Tuyệt đối không để trống trạng thái "Mã hàng" và "Lệnh sản xuất" trong báo cáo hao hụt của thợ (như Lê Văn Tùng), vì đây là căn cứ pháp lý để thực hiện thu hồi tài sản.
3. Hệ thống: Cần đặc biệt lưu ý các mặt hàng Platinum (PT900) ở trạng thái "Treo nợ" để có phương án thu hồi bột cuối tháng triệt để hơn.

Chỉ khi mọi trạng thái đều "Sạch" và "Rõ ràng", Asiana Gold mới có thể tối ưu hóa lợi nhuận và đảm bảo sự phát triển bền vững trong ngành sản xuất kim hoàn.
