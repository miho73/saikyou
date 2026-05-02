import api from "../axios";

interface CaptchaSolution {
  solution: string;
  confidence: number;
}

export async function solveCaptcha(image: [number, number, number][]): Promise<CaptchaSolution> {
  const res = await api.post<CaptchaSolution>("/captcha/solve", { image });
  return res.data;
}
