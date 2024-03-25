/* Routes for the invoices. */

const express = require("express");
const routerInvoices = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");


routerInvoices.get("/", async (req, res, next) => {

    try {
        const result = await db.query(`SELECT * FROM invoices`);
        const idCode = result.rows.map(({ id, comp_code }) => ({id, comp_code}));

        return res.json({ invoices: idCode });
    } catch (e) {
        return next(e);
    }
});

routerInvoices.get("/:id", async (req, res, next) => {
    const id = req.params.id;

    try {

        const result = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);

        if (!result.rows.length) {
            throw new ExpressError(`Invoice with ID ${id} can't be found.`, 404);
        }

        const { amt, paid, add_date, paid_date, comp_code } = result.rows[0]
        const company = await db.query(`SELECT *  FROM companies WHERE code=$1`, [comp_code]);

        return res.json({ invoices: {id, amt, paid, add_date, paid_date, company: company.rows[0]} });

    } catch (e) {
        return next(e);
    }
});

routerInvoices.post("/", async (req, res, next) => {
    const data = req.body;

    try {
        if (!data.comp_code || !data.amt) {
            throw new ExpressError("Missing Key.", 400);
        }

        const company = await db.query(`SELECT * FROM companies WHERE code=$1 `, [data.comp_code]);
        if (!company.rows.length) {
            throw new ExpressError(`Company With Code ${data.comp_code} Can't Be Found.`, 404);
        }

        const result = await db.query(
            `INSERT INTO invoices(comp_code, amt) VALUES($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [data.comp_code, data.amt]
        );

        return res.json({invoice: result.rows[0]});


    } catch (e) {
        return next(e);
    }
});

routerInvoices.put("/:id", async (req, res, next) => {
    const id = req.params.id;
    const amt = req.body.amt;

    try {
        if (!amt) {
            throw new ExpressError(`Missing Key.`, 400);
        }

        const result = await db.query(
            `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, id]
        );

        if (!result.rows.length) {
            throw new ExpressError(`Invoice With ID ${id} Can't Be Found.`, 404);
        }

        return res.json({ invoice: result.rows[0] });
    } catch (e) {
        return next(e);
    }
});

routerInvoices.delete("/:id", async (req, res, next) => {

    try {
        const result = await db.query(
            `DELETE FROM invoices WHERE id=$1 RETURNING id`,
            [req.params.id]
        );

        if (!result.rows.length) {
            throw new ExpressError(`Company With Code ${req.params.id} Can't Be Found.`, 404);
        }

        return res.json({ status: "deleted" });
    } catch (e) {
        return next(e);
    }
});


module.exports = routerInvoices;