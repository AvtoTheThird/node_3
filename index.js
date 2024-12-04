const filmList = require("./top250.json");
const fs = require("fs");
const express = require("express");
const app = express();
const path = require("path");

const uuid = require("uuid");
var bodyParser = require("body-parser");
const { error } = require("console");
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const dataPath = path.join(__dirname, "top250.json");

function readData() {
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function sortByPosition(films) {
  return films.sort((a, b) => a.position - b.position);
}

app.get(" /", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});

app.get("/films/readall", (req, res) => {
  const films = sortByPosition(readData());
  res.json(films);
});

app.get("/films/read", (req, res) => {
  const { id } = req.body;
  const films = readData();
  const film = films.find((f) => f.id === id);

  if (!film) return res.status(404).json({ error: "Film not found" });
  res.json(film);
});

app.post("/films/create", (req, res) => {
  const newFilm = req.body;

  if (
    !newFilm.title ||
    !newFilm.rating ||
    !newFilm.year ||
    newFilm.year < 1888 ||
    newFilm.budget < 0 ||
    newFilm.gross < 0 ||
    !newFilm.poster
  ) {
    return res.status(400).json({ error: "invalid fields" });
  }

  const films = sortByPosition(readData());

  if (newFilm.position > films.length + 1) {
    newFilm.position = films.length + 1;
  } else {
    films.forEach((f) => {
      f.position >= newFilm.position ? f.position++ : null;
    });
  }

  newFilm.id = uuid.v4();

  films.push(newFilm);
  writeData(films);
  res.status(200).json(newFilm);
});

app.post("/films/update", (req, res) => {
  const { id, ...updates } = req.body;
  const films = readData();
  const film = films.find((f) => f.id === id);

  if (!film)
    return res
      .status(404)
      .json({ error: "film with provided id was not found" });

  Object.assign(film, updates);

  if (updates.position) {
    films.forEach((f) => {
      f.position >= updates.position && f.id !== id ? f.position++ : null;
    });
  }
  writeData(sortByPosition(films));
  res.json(film);
});

app.post("/films/delete", (req, res) => {
  const { id } = req.body;
  const films = readData();
  const index = films.findIndex((f) => f.id === id);
  if (index === -1)
    return res
      .status(404)
      .json({ error: "film with provided id was not found" });

  films.splice(index, 1);

  films.forEach((f, i) => {
    f.position = i + 1;
  });

  writeData(films);
  res.json({ success: true });
});
