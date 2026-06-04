import { average, formatScore, performanceBand, studentAverage } from "@/lib/metrics";
import type { Score } from "@/lib/types";

function orderedScores(scores: Score[]) {
  return [...scores].sort((a, b) => {
    const aDate = a.exams?.date ?? a.created_at;
    const bDate = b.exams?.date ?? b.created_at;
    return new Date(aDate).getTime() - new Date(bDate).getTime();
  });
}

function scoreTitle(score: Score) {
  return score.exams?.title ?? "Bài kiểm tra";
}

function compactTitles(scores: Score[], limit = 2) {
  return scores
    .slice(0, limit)
    .map(scoreTitle)
    .join(", ");
}

export function deriveStudentEvaluation(scores: Score[]) {
  const ordered = orderedScores(scores);
  const avg = studentAverage(ordered);
  const band = performanceBand(avg);
  const latest = ordered.at(-1) ?? null;
  const recentScores = ordered.slice(-3);
  const previousScores = ordered.slice(Math.max(0, ordered.length - 6), Math.max(0, ordered.length - 3));
  const recentAvg = average(recentScores.map((score) => score.score));
  const previousAvg = average(previousScores.map((score) => score.score));
  const diff = recentAvg !== null && previousAvg !== null ? recentAvg - previousAvg : null;
  const trend =
    diff === null ? "unknown" : diff >= 0.4 ? "up" : diff <= -0.4 ? "down" : "stable";
  const lowRecentScores = recentScores.filter((score) => score.score < 6.5);
  const lowestScores = [...ordered].sort((a, b) => a.score - b.score);
  const strongestScores = [...ordered].sort((a, b) => b.score - a.score);

  const strengths: string[] = [];
  const improvements: string[] = [];
  const actions: string[] = [];

  if (!ordered.length) {
    return {
      band,
      headline: "Chưa đủ dữ liệu đánh giá",
      summary:
        "Hệ thống sẽ tự tạo đánh giá khi học sinh có điểm kiểm tra. Phụ huynh và học sinh sẽ nhìn thấy cùng một căn cứ đánh giá.",
      strengths: ["Chưa có điểm kiểm tra được lưu."],
      improvements: ["Cần nhập điểm hoặc kết quả bài kiểm tra đầu tiên để theo dõi năng lực."],
      actions: ["Giáo viên có thể thêm điểm và nhận xét để hồ sơ học tập minh bạch hơn."],
      evidence: [
        { label: "Số bài", value: "0" },
        { label: "Điểm TB", value: "Chưa có" },
        { label: "Xu hướng", value: "Chưa có" }
      ]
    };
  }

  if ((avg ?? 0) >= 8) {
    strengths.push("Nền tảng hiện tại tốt, điểm trung bình đang ở nhóm khá cao.");
    improvements.push("Duy trì độ ổn định, tránh chủ quan ở các bài kiểm tra sắp tới.");
    actions.push("Tiếp tục luyện bài nâng cao và tự giải thích lại lỗi sai sau mỗi bài.");
  } else if ((avg ?? 0) >= 6.5) {
    strengths.push("Đã có nền tảng để theo kịp lớp và xử lý được phần lớn yêu cầu bài học.");
    improvements.push("Cần tăng độ chính xác, đặc biệt ở các bài có điểm dưới 6.5.");
    actions.push("Mỗi tuần ôn lại các lỗi sai phổ biến và làm thêm bài luyện ngắn 15-20 phút.");
  } else if ((avg ?? 0) >= 5) {
    strengths.push("Có dữ liệu học tập để theo dõi tiến bộ và xác định phần cần hỗ trợ.");
    improvements.push("Cần củng cố kiến thức nền trước khi chuyển sang dạng bài khó hơn.");
    actions.push("Ưu tiên ôn từ vựng, cấu trúc câu và làm lại các bài kiểm tra điểm thấp.");
  } else {
    strengths.push("Đã bắt đầu có điểm để giáo viên, học sinh và phụ huynh cùng theo dõi.");
    improvements.push("Cần hỗ trợ sát hơn về nền tảng, nhịp học và cách làm bài.");
    actions.push("Nên học lại từng phần nhỏ, kiểm tra ngắn thường xuyên và đặt mục tiêu tăng 0.5-1 điểm.");
  }

  if (trend === "up") {
    strengths.push("Điểm gần đây đang tăng so với giai đoạn trước.");
  } else if (trend === "down") {
    improvements.push("Điểm gần đây đang giảm, cần xem lại nguyên nhân trước bài tiếp theo.");
    actions.push("Phụ huynh nên nhắc học sinh dành thời gian sửa bài trong tuần này.");
  } else if (trend === "stable" && ordered.length >= 4) {
    strengths.push("Kết quả gần đây tương đối ổn định.");
  }

  if (lowRecentScores.length) {
    improvements.push(`Ưu tiên cải thiện các bài gần đây còn thấp: ${compactTitles(lowRecentScores)}.`);
  }

  if (strongestScores[0]) {
    strengths.push(`Bài làm tốt nhất gần đây: ${scoreTitle(strongestScores[0])} (${formatScore(strongestScores[0].score)} điểm).`);
  }

  if (lowestScores[0] && lowestScores[0].score < 6.5) {
    actions.push(`Làm lại bài "${scoreTitle(lowestScores[0])}" để kiểm tra phần kiến thức còn hổng.`);
  }

  return {
    band,
    headline:
      trend === "up"
        ? "Đang có tín hiệu tiến bộ"
        : trend === "down"
          ? "Cần chú ý để lấy lại nhịp học"
          : "Năng lực hiện tại cần được duy trì và theo dõi",
    summary:
      `Đánh giá này dựa trên ${ordered.length} bài kiểm tra đã lưu. ` +
      `Điểm trung bình hiện tại là ${formatScore(avg)}, thuộc band ${band.vi} / ${band.en}.`,
    strengths,
    improvements,
    actions,
    evidence: [
      { label: "Số bài", value: String(ordered.length) },
      { label: "Điểm TB", value: formatScore(avg) },
      { label: "TB 3 bài gần nhất", value: formatScore(recentAvg) },
      { label: "Bài gần nhất", value: latest ? formatScore(latest.score) : "Chưa có" },
      {
        label: "Xu hướng",
        value: trend === "up" ? "Đang tăng" : trend === "down" ? "Đang giảm" : trend === "stable" ? "Ổn định" : "Chưa đủ dữ liệu"
      }
    ]
  };
}
