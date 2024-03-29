/* Routes for the companies. */

const express = require("express");
const routerCompanies = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const slugify = require("slugify");


routerCompanies.get("/", async (req, res, next) => {
    try {
        const result = await db.query(`SELECT * FROM companies`);
        const codeName = result.rows.map(({ code, name }) => ({ code, name }));

        return res.json({companies: codeName});
    } catch (e) {
        return next(e);
    }
});

routerCompanies.get("/:code", async (req, res, next) => {
    try {
        const code = req.params.code;
        const result = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);

        if (!result.rows.length) {
            throw new ExpressError(`Company With Code ${code} Not Found!`, 404);
        }

        const invoices = await db.query(
            `SELECT * FROM invoices WHERE comp_code=$1`,
            [code]
        );

        return res.json({
            company: result.rows[0],
            invoices: invoices.rows.map(({ id, amt, paid, add_date, paid_date }) => ({ id, amt, paid, add_date, paid_date }))
        });
    } catch (e) {
        return next(e);
    }
});

routerCompanies.post("/", async (req, res, next) => {
    try {
        const company = req.body;

        if (!company.name || !company.description) {
            throw new ExpressError("Bad Request", 400);
        }

        const code = slugify(company.name.toLowerCase(), { strict: true, remove: /[aeiouy]/gi });

        const toCheck = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);

        if (toCheck.rows.length) {
            throw new ExpressError(`Company with code ${code} already exist!`, 409);
        }

        const result = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES($1, $2, $3) RETURNING code, name, description`,
            [code, company.name, company.description]);

        return res.status(201).json({company: result.rows[0]});
    } catch (e) {
        return next(e);
    }
});

routerCompanies.put("/:code", async (req, res, next) => {
    const company = req.body;
    const code = req.params.code;
    try {
        if (!company.name || !company.description) {
            throw new ExpressError("Missing Key.", 400);
        }

        const result = await db.query(
            `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
            [company.name, company.description, code]
        );

        if (!result.rows.length) {
            throw new ExpressError(`Company With Code ${code} Can't Be Found.`, 404);
        }

        return res.json({company: result.rows[0]});
    } catch (e) {
        return next(e);
    }
});

routerCompanies.delete("/:code", async (req, res, next) => {
    const code = req.params.code;

    try {
        const result = await db.query(
            `DELETE FROM companies WHERE code=$1 RETURNING code`,
            [code]
        );

        if (!result.rows.length) {
            throw new ExpressError(`Company With Code ${code} Can't Be Found.`, 404);
        }

        return res.json({status: "deleted"});

    } catch (e) {
        return next(e);
    }
});


module.exports = routerCompanies;