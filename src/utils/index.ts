export const randomNumber = () => {
  const timestamp = Date.now().toString(); // 获取当前时间戳
  const random =
    Math.floor(Math.random() * 9000000000000000) + 1000000000000000; // 生成15位随机数
  let identifier = timestamp + random.toString(); // 结合时间戳和随机数
  if (identifier.length > 19) {
    identifier = identifier.substr(0, 19); // 如果标识符超过19位，则截取前19位
  }
  if (identifier.charAt(0) === "0") {
    identifier = "1" + identifier.substr(1); // 如果开头是0，则将第一个字符替换为1
  }
  return identifier;
};
