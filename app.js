//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Suhel-Kap:test123@suhels.lzasi.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const Item = mongoose.model("items", itemsSchema);

const List = mongoose.model("List", listsSchema);

const item1 = new Item({
  name: "Welcome to your todo-list",
});
const item2 = new Item({
  name: "Hit the + to add new items",
});
const item3 = new Item({
  name: "<-- Hit the checkbox to delete an item",
});

const defaultArray = [item1, item2, item3];

app.get("/", function (req, res) {
  const day = date.getDate();
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultArray, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Item Added Successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  const newItem = req.body.newItem;
  const listTitle = req.body.list;

  const newListItem = new Item({
    name: newItem,
  });
  if (req.body.list === date.getDate()) {
    newListItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }, (err, foundList) => {
      foundList.items.push(newListItem);
      foundList.save();
      res.redirect("/" + listTitle);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === date.getDate()) {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //create a list
        const list = new List({
          name: customListName,
          items: defaultArray,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
