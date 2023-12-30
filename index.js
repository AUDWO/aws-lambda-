//lambda는 3개의 매개변수를 제공하면서 함수를 호출
const sharp = require("sharp");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client();

exports.handler = async (event, context, callback) => {
  //버켓 이름
  const Bucket = event.Records[0].s3.bucket.name;
  console.log(Bucket, "bucket bucket bucket bucket");
  //Key:파일 이름
  const Key = decodeURIComponent(event.Records[0].s3.object.key); // original/example.png
  console.log(Key, "key key key key key key key key");
  const filename = Key.split("/").at(-1);
  console.log(filename, "file file file file file file file");
  //확장자
  const ext = Key.split(".").at(-1).toLowerCase();
  const requiredFormat = ext === "jpg" ? "jpeg" : ext;
  console.log("name name name name name ", filename, "ext", ext);

  try {
    //s3에서 resizing되지 않은 이미지 가져오기
    const getObject = await s3.send(new GetObjectCommand({ Bucket, Key }));
    const buffers = [];
    for await (const data of getObject.Body) {
      buffers.push(data);
    }
    const imageBuffer = Buffer.concat(buffers);
    const resizedImage = await sharp(imageBuffer)
      .resize(400, 400, { fit: "inside" })
      .toFormat(requiredFormat)
      .toBuffer();
    //다시 s3에 저장
    await s3.send(
      new PutObjectCommand({
        Bucket,
        Key: `thumb/${filename}`,
        Body: resizedImage,
      })
    );
    console.log("put", resizedImage.length);
    //첫번째 error 두번째 응답값
    return callback(null, `thumb/${filename}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};
