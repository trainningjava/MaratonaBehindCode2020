const SpeechToTextV1 = require("ibm-watson/speech-to-text/v1");
const NaturalLanguageUnderstandingV1 = require("ibm-watson/natural-language-understanding/v1");

const { IamAuthenticator } = require("ibm-watson/auth");

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { type } = require("os");

const app = express();

app.set("view engine", "ejs");

const location = process.env.LOCATION || "local";

let fileAudio;
const directoryAudio = "audio/";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, directoryAudio);
  },
  limits: {
    files: 1,
    fileSize: 1024 * 1024,
  },
  filename: (req, file, cb) => {
    fileAudio = Date.now() + "-" + file.originalname;
    cb(null, fileAudio);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var path = require("path");
    var ext = path.extname(file.originalname);
    if (ext !== ".flac") {
      return callback(new Error("Only flac file is allowed"));
    }
    callback(null, true);
  },
});

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: "2020-09-13",
  authenticator: new IamAuthenticator({
    apikey: "API",
  }),
  serviceUrl: "URL",
  headers: {
    "X-Watson-Learning-Opt-Out": "false",
  },
  disableSslVerification: true,
});

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: "API",
  }),
  url: "URL",
});

app.get("/", (_, res) => {
  // return res.send("<h1>Hello  from " + location + "</h1>");
  res.render("home");
});

app.post("/recommend", upload.single("audio"), async (req, res) => {
  const audio = req.file;
  const car = req.body.car;
  let text = req.body.text;

  function analyzeText(text) {
    const analyzeParams = {
      text: text,
      features: {
        entities: {
          model: "MODEL_ID",
          sentiment: true,
          limit: 255,
        },
      },
    };

    function addEntities(name, array) {
      let ret1 = { entity: name, sentiment: 0, mention: "" };
      for (let i = 0; i < array.length; i++) {
        if (array[i].sentiment < ret1["sentiment"]) {
          ret1["sentiment"] = array[i].sentiment;
          ret1["mention"] = array[i].mention;
        }
      }
      return ret1;
    }

    naturalLanguageUnderstanding
      .analyze(analyzeParams)
      .then((analysisResults) => {
        // return list of entities
        const resultado = analysisResults.result.entities.map((result) => {
          var payload = [];
          payload["entity"] = result.type;
          payload["sentiment"] = result.sentiment.score;
          payload["mention"] = result.text;
          return payload;
        });

        let resul1 = resultado.filter((en) => {
          return en.entity === "MODELO";
        });

        const lenResult = resul1.length;

        if (lenResult == 0) {
          res.send({ recommendation: "", entities: [] });
        } else {
          var employee = {};
          var ent1 = [];

          let selectcar = car;

          for (let i = 0; i < lenResult; i++) {
            if (resul1[i].mention != selectcar) {
              selectcar = resul1[i].mention;
              break;
            }
          }

          if (car == selectcar && lenResult != 1) {
            res.send({ recommendation: "", entities: [] });
          }

          employee["recommendation"] = selectcar;

          console.log(resultado);

          let retarr = resultado.filter((en) => {
            return en.entity === "SEGURANCA" && en.sentiment < 0;
          });
          if (retarr.length > 0) {
            const ret1 = addEntities("SEGURANCA", retarr);
            ent1.push(ret1);
            employee["entities"] = ent1;
          }

          retarr = resultado.filter((en) => {
            return en.entity === "CONSUMO" && en.sentiment < 0;
          });
          if (retarr.length > 0) {
            const ret1 = addEntities("CONSUMO", retarr);
            ent1.push(ret1);
            employee["entities"] = ent1;
          }

          retarr = resultado.filter((en) => {
            return en.entity === "DESEMPENHO" && en.sentiment < 0;
          });
          if (retarr.length > 0) {
            const ret1 = addEntities("DESEMPENHO", retarr);
            ent1.push(ret1);
            employee["entities"] = ent1;
          }

          retarr = resultado.filter((en) => {
            return en.entity === "MANUTENCAO" && en.sentiment < 0;
          });
          if (retarr.length > 0) {
            const ret1 = addEntities("MANUTENCAO", retarr);
            ent1.push(ret1);
            employee["entities"] = ent1;
          }

          retarr = resultado.filter((en) => {
            return en.entity === "CONFORTO" && en.sentiment < 0;
          });
          if (retarr.length > 0) {
            const ret1 = addEntities("CONFORTO", retarr);
            ent1.push(ret1);
            employee["entities"] = ent1;
          }

          retarr = resultado.filter((en) => {
            return en.entity === "DESIGN" && en.sentiment < 0;
          });
          if (retarr.length > 0) {
            const ret1 = addEntities("DESIGN", retarr);
            ent1.push(ret1);
            employee["entities"] = ent1;
          }

          retarr = resultado.filter((en) => {
            return en.entity === "ACESSORIOS" && en.sentiment < 0;
          });
          if (retarr.length > 0) {
            const ret1 = addEntities("ACESSORIOS", retarr);
            ent1.push(ret1);
            employee["entities"] = ent1;
          }
        }

        res.send(employee);
      })
      .catch((err) => {
        console.log("error2:", err);
      });
  }

  if (!car) {
    return res.json({
      err: "Parâmetro requerido não encontrado.",
    });
  } else if (!text && !audio) {
    return res.json({
      err: "Parâmetro requerido não encontrado.",
    });
  } else if (audio) {
    const fileflac = "./" + directoryAudio + fileAudio;

    if (!fs.existsSync(fileflac)) {
      res.send("Audio file not found");
    }

    const params = {
      audio: fs.createReadStream(fileflac),
      contentType: "audio/flac",
      model: "pt-BR_BroadbandModel",
      maxAlternatives: 1,
    };

    speechToText
      .recognize(params)
      .then((response) => {
        const transcriptText = JSON.stringify(response.result, null, 2);
        const transcriptText1 = JSON.parse(transcriptText);
        text = transcriptText1.results[0].alternatives[0].transcript.trim();
        analyzeText(text);
      })
      .catch((err) => {
        console.log("error1:", err);
      });
    try {
      console.log(fileflac);
      fs.unlinkSync(fileflac);
    } catch {
      console.error("Remoção do arquivo falhada.");
    }
  } else {
    analyzeText(text);
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log("Executando na porta", port));
