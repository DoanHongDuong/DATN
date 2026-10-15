"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEVERITY_THRESHOLDS = void 0;
exports.getSeverityLevel = getSeverityLevel;
exports.getRecommendation = getRecommendation;
const client_1 = require("@prisma/client");
exports.SEVERITY_THRESHOLDS = {
    PHQ9: [
        { min: 0, max: 4, level: client_1.SeverityLevel.MINIMAL },
        { min: 5, max: 9, level: client_1.SeverityLevel.MILD },
        { min: 10, max: 14, level: client_1.SeverityLevel.MODERATE },
        { min: 15, max: 19, level: client_1.SeverityLevel.MODERATELY_SEVERE },
        { min: 20, max: 27, level: client_1.SeverityLevel.SEVERE },
    ],
    GAD7: [
        { min: 0, max: 4, level: client_1.SeverityLevel.MINIMAL },
        { min: 5, max: 9, level: client_1.SeverityLevel.MILD },
        { min: 10, max: 14, level: client_1.SeverityLevel.MODERATE },
        { min: 15, max: 21, level: client_1.SeverityLevel.SEVERE },
    ],
};
function getSeverityLevel(testCode, totalScore) {
    const thresholds = exports.SEVERITY_THRESHOLDS[testCode];
    if (!thresholds) {
        return client_1.SeverityLevel.MINIMAL;
    }
    for (const threshold of thresholds) {
        if (totalScore >= threshold.min && totalScore <= threshold.max) {
            return threshold.level;
        }
    }
    return client_1.SeverityLevel.SEVERE;
}
function getRecommendation(testCode, level) {
    switch (level) {
        case client_1.SeverityLevel.MINIMAL:
            return 'Tình trạng tâm lý của bạn hiện ở mức bình thường hoặc tối thiểu. Hãy tiếp tục duy trì lối sống điều độ, ngủ đủ giấc và vận động thể thao để giữ tinh thần luôn thoải mái.';
        case client_1.SeverityLevel.MILD:
            return 'Bạn đang có dấu hiệu căng thẳng hoặc lo âu nhẹ. Hãy dành thời gian nghỉ ngơi, thực hành các bài tập nhịp thở 4-7-8, nghe âm thanh thư giãn hoặc viết nhật ký để giải tỏa áp lực.';
        case client_1.SeverityLevel.MODERATE:
            return 'Bạn đang có biểu hiện lo âu / căng thẳng ở mức độ vừa. Khuyến nghị bạn thực hành thư giãn đều đặn hàng ngày và cân nhắc kết nối trực tuyến với Tình nguyện viên của MindCare để được lắng nghe và hỗ trợ.';
        case client_1.SeverityLevel.MODERATELY_SEVERE:
            return 'Mức độ căng thẳng / trầm cảm của bạn khá cao và có thể ảnh hưởng đến học tập, sinh hoạt. Hãy liên hệ ngay với Tình nguyện viên tâm lý hoặc tìm kiếm tư vấn từ chuyên gia tâm lý.';
        case client_1.SeverityLevel.SEVERE:
            return 'Mức độ nghiêm trọng. Bạn cần tìm kiếm sự hỗ trợ chuyên môn từ bác sĩ hoặc chuyên gia tâm lý sớm nhất có thể. Nếu bạn cảm thấy bất an hoặc có suy nghĩ tiêu cực, hãy gọi ngay đường dây nóng khẩn cấp để được trợ giúp 24/7.';
        default:
            return 'Hãy theo dõi cảm xúc thường xuyên và kết nối với chúng tôi khi bạn cần hỗ trợ.';
    }
}
//# sourceMappingURL=severity-thresholds.constant.js.map