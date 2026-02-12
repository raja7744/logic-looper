import dayjs from "dayjs";
import SHA256 from "crypto-js/sha256";

export function getDailySeed() {
  const today = dayjs().format("YYYY-MM-DD");
  const hash = SHA256(today).toString();
  return hash;
}
