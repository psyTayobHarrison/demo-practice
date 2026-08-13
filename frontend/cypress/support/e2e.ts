// Cypress E2E support file

const API = 'http://localhost:8080/api';

declare global {
  namespace Cypress {
    interface Chainable {
      /** Create a category via API and return its response */
      createCategory(name: string): Chainable<any>;
      /** Clean all data by deleting all categories */
      cleanData(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('createCategory', (name: string) => {
  return cy.request('POST', `${API}/categories`, { name }).its('body');
});

Cypress.Commands.add('cleanData', () => {
  // Delete all categories
  cy.request('GET', `${API}/categories`).then((res) => {
    (res.body as any[]).forEach((category) => {
      cy.request('DELETE', `${API}/categories/${category.id}`);
    });
  });
});
