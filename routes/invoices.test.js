process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;
let testCompany

beforeEach(async function () {
    let resultC = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('googl', 'Google', 'Google Class A Shares')
      RETURNING code, name, description`);
    testCompany = resultC.rows[0];

    let resultI = await db.query(`
    INSERT INTO
      invoices (comp_code, amt) VALUES ('googl', 23.23)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testInvoice = resultI.rows[0];
});


/* GET /invoices - returns `{invoices: [{id, comp_code}, ...]}` */
describe("GET /invoices", function () {
    test("Gets a list of 1 invoice", async function () {
        const response = await request(app).get(`/invoices`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code }] });
    });
});


/* POST /invoices - create company from data; return `{company: company}` */
describe("POST /invoices", function () {
    test("Creates a new invoice", async function () {
        const response = await request(app)
            .post(`/invoices`)
            .send({
                comp_code: "googl",
                amt: 7.7
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: "googl",
                amt: 7.7,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });

    test("Can't create new invoice. Missing Key", async function () {
        const response = await request(app).post(`/invoices`)
            .send({
                comp_code: "googl"
            });
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            error: {
                message: "Missing Key.",
                status: 400
            }
        });
    });
});


/* GET /invoices/:id - return data about one invoice: `{invoice: {..., company: {}}}` */
describe("GET /invoices/:id", function () {
    test("Gets a single invoice", async function () {
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);        

        expect(response.body).toEqual({
            invoice: {
                id: testInvoice.id,
                amt: testInvoice.amt,
                paid: testInvoice.paid,
                add_date: expect.any(String),
                paid_date: null,
                company: testCompany
            }
        });
    });

    test("Responds with 404 if can't find invoice", async function () {
        const response = await request(app).get(`/invoices/0`);
        expect(response.statusCode).toEqual(404);
    });
});


/* PUT /invoices/:id - update company; return `{invoice: invoice}` */
describe("PUT /invoices/:id", function () {
    test("Updates a single invoice", async function () {
        const response = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send({ amt: 7.7 });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoice: {
                id: testInvoice.id,
                comp_code: testCompany.code,
                amt: 7.7,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });

    test("Missing Key", async function () {
        const response = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send({ name: 7.7 });
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            error: {
                message: "Missing Key.",
                status: 400
            }
        });
    });

    test("Responds with 404 if can't find an invoice", async function () {
        const response = await request(app).patch(`/invoices/0`);
        expect(response.statusCode).toEqual(404);
    });
});


/* DELETE /invoices/:id - delete invoice, return `{status: "deleted"}` */
describe("DELETE /invoices/:id", function () {
    test("Deletes a single company", async function () {
        const response = await request(app)
            .delete(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            status: "deleted"
        });
    });

    test("Invoice doesn't exist", async function () {
        const response = await request(app)
            .delete(`/invoices/0`);
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: `Invoice With ID 0 Can't Be Found.`,
                status: 404
            }
        });
    });
});


afterEach(async function () {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
});


afterAll(async function () {
    await db.end();
});
