const fs = require('fs');
const potrace = require('potrace');

const Jimp = require('jimp');
const multer = require('multer');
const path = require('path');
const express = require('express');
const sharp = require('sharp');
const inputImagePath = 'before.png';
const TEMP_NAME = 'temp.jpg';

const OUTPUT_FOLDER = 'convertidas';
const UPLOADS_FOLDER = 'uploads';

const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
if (!fs.existsSync(OUTPUT_FOLDER)) {
  fs.mkdirSync(OUTPUT_FOLDER);
}
if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    const extension = file.originalname.split('.').pop();

    cb(null, `${Date.now()}.${extension}`);
  },
});

const upload = multer({ storage });

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/convert', upload.single('imagen'), async (req, res) => {
  const brightness = parseFloat(req.body.brightness);
  const threshold = parseFloat(req.body.threshold);
  const turdSize = parseFloat(req.body.turdSize);
  const optCurve = req.body.optCurve == 'true';

  console.log(req.body);
  sharp(req.file.path)
    .metadata()
    .then((metadata) => {
      const initialWidth = metadata.width;
      const initialHeight = metadata.height;

      console.log(initialWidth, initialHeight);

      let targetWidth = initialWidth;
      let targetHeight = initialHeight;

      const factor = initialWidth / initialHeight;
      if (initialWidth > MAX_WIDTH) {
        targetWidth = MAX_WIDTH;
        targetHeight = Math.round(targetWidth / factor);
      } else if (initialHeight > MAX_HEIGHT) {
        targetHeight = MAX_HEIGHT;

        targetWidth = Math.round(targetHeight * factor);
      }

      console.log(targetWidth, targetHeight);

      sharp(req.file.path)
        .toFormat('png')
        .resize(targetWidth, targetHeight)
        .toFile(TEMP_NAME, async (err) => {
          if (err) {
            console.error(err);
            return;
          }

          const nuevaImagen = new Jimp(targetWidth, targetHeight, 0xffffffff);
          const image = await Jimp.read(TEMP_NAME);

          image.write('aber.png');
          nuevaImagen.composite(image, 0, 0);

          nuevaImagen
            .grayscale()
            // .invert()
            .brightness(brightness)
            .write(TEMP_NAME, (err) => {
              if (err) {
                console.error(err);
                return;
              }

              const bitmap = fs.readFileSync(TEMP_NAME);
              const options = {
                threshold, // Umbral para la binarización
                turdSize, // Tamaño mínimo de los detalles a eliminar
                optCurve, // Optimizar curvas
              };

              potrace.trace(bitmap, options, (err, svg) => {
                if (err) {
                  console.error(err);
                  return;
                }
                const output = `${OUTPUT_FOLDER}/${Date.now()}.svg`;
                fs.writeFileSync(output, svg);
                fs.rmSync(TEMP_NAME);
                res.sendFile(`${__dirname}/${output}`);
              });
            });
        });
    });
});

const PORT = 5555;

app.listen(PORT, () => {
  console.log(`Servidor Express iniciado en http://localhost:${PORT}`);
});
