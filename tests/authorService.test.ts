import app from "../server";
import request from "supertest";
import Author from "../models/author";

describe("Verify GET /authors", () => {

    let consoleSpy: jest.SpyInstance;

    beforeAll(() => {
        consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });

    it("should respond with a sorted list of authors by family name", async () => {
        const mockAuthors = [
            { first_name: "Alice", family_name: "Smith", date_of_birth: "1950-01-01", date_of_death: "2020-01-01" },
            { first_name: "Charlie", family_name: "Johnson", date_of_birth: "1975-05-05" },
            { first_name: "Bob", family_name: "Anderson", date_of_birth: "1920-07-07", date_of_death: "1985-12-12" }
        ];
    
        Author.getAllAuthors = jest.fn().mockResolvedValue(
            mockAuthors
                .sort((a, b) => a.family_name.localeCompare(b.family_name))
                .map(author => ({
                    name: `${author.first_name} ${author.family_name}`,
                    lifespan: `${author.date_of_birth ? author.date_of_birth.split('-')[0] : ''}-${author.date_of_death ? author.date_of_death.split('-')[0] : ''}`
                }))
        );
    
        const response = await request(app).get("/authors");
        expect(response.statusCode).toBe(200);
    
        const expectedAuthors = [
            { name: "Bob Anderson", lifespan: "1920-1985" },
            { name: "Charlie Johnson", lifespan: "1975-" },
            { name: "Alice Smith", lifespan: "1950-2020" }
        ];
        expect(response.body).toStrictEqual(expectedAuthors);
    });
    

    it("should respond with 404 if no authors exist", async () => {
        Author.getAllAuthors = jest.fn().mockResolvedValue([]);
        const response = await request(app).get("/authors");
        expect(response.text).toBe("No authors found");
    });

    it("should respond with 500 if there is an error fetching authors", async () => {
        Author.getAllAuthors = jest.fn().mockRejectedValue(new Error("Database error"));
        const response = await request(app).get("/authors");
        expect(response.statusCode).toBe(500);
        expect(response.text).toBe("Error fetching authors");
        expect(consoleSpy).toHaveBeenCalled();
    });
});