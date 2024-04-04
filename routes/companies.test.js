process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
    let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('googl', 'Google', 'Google Class A Shares')
      RETURNING code, name, description`);
    testCompany = result.rows[0];
});


/* GET /companies - returns `{companies: [{code, name}, ...]}` */
describe("GET /companies", function () {
    test("Gets a list of 1 company", async function () {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({companies: [{code:testCompany.code, name:testCompany.name}]});
    });
});


/* POST /companies - create company from data; return `{company: company}` */
describe("POST /companies", function () {
    test("Creates a new company", async function () {
        const response = await request(app)
            .post(`/companies`)
            .send({
                name: "Tesla",
                description: "Accelerating the World's Transition to Sustainable Energy"
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: "tsl",
                name: "Tesla",
                description: "Accelerating the World's Transition to Sustainable Energy"
            }
        });
    });

    test("Can't create new company. Missing Key", async function () {
        const response = await request(app).post(`/companies`)
            .send({
                name: "Amazon"
            });
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            error: {
                message: "Bad Request",
                status: 400
            }
        });
    });
});


/* GET /companies/:code - return data about one company: `{company: company, invoices: [...]}` */
describe("GET /companies/:code", function () {
    test("Gets a single company", async function () {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ company: testCompany, invoices: expect.any(Array) });
    });

    test("Responds with 404 if can't find company", async function () {
        const response = await request(app).get(`/companies/0`);
        expect(response.statusCode).toEqual(404);
    });
});


/* PUT /companies/:code - update company; return `{company: company}` */
describe("PUT /companies/:code", function () {
    test("Updates a single company", async function () {
        const response = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send({
                name: "Google",
                description: "Google Class B Shares. Held by the founders."
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: testCompany.code,
                name: testCompany.name,
                description: "Google Class B Shares. Held by the founders."
            }
        });
    });

    test("Missing Key", async function () {
        const response = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send({ name: "Google" });
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            error: {
                message: "Missing Key.",
                status: 400
            }
        });
    });

    test("Responds with 404 if can't find company", async function () {
        const response = await request(app).patch(`/companies/0`);
        expect(response.statusCode).toEqual(404);
    });
});


/* DELETE /companies/:code - delete company, return `{error: {message, status}}` */
describe("DELETE /companies/:code", function () {
    test("Deletes a single company", async function () {
        const response = await request(app)
            .delete(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            status: "deleted"
        });
    });

    console.log(testCompany);

    test("Company doesn't exist", async function () {
        const response = await request(app)
            .delete(`/companies/tsla`);
        expect(response.statusCode).toEqual(404);
        expect(response.body).toEqual({
            error: {
                message: `Company With Code tsla Can't Be Found.`,
                status: 404
            }
        });
    });
});


afterEach(async function () {
    await db.query("DELETE FROM companies");
});


afterAll(async function () {
    await db.end();
});
