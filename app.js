/** BizTime express application. */


const express = require("express");
const routerCompanies = require("./routes/companies");
const routerInvoices = require("./routes/invoices");
const app = express();
const ExpressError = require("./expressError")

app.use(express.json());

app.use("/companies", routerCompanies);
app.use("/invoices", routerInvoices);


/** 404 handler */
app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */
app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({error: err});
});


module.exports = app;
