describe('Category CRUD', () => {
  beforeEach(() => {
    cy.cleanData();
  });

  it('should create a new category', () => {
    cy.visit('/categories');
    cy.contains('No categories yet').should('be.visible');

    // Navigate to create form
    cy.contains('+ New Category').click();
    cy.get('h1').should('contain', 'New Category');

    // Fill and submit
    cy.get('#category-name').type('Groceries');
    cy.contains('button', 'Save Category').click();

    // Should redirect to list and show the new category
    cy.url().should('include', '/categories');
    cy.contains('.list-item-name', 'Groceries').should('be.visible');
  });

  it('should edit an existing category', () => {
    // Seed a category via API
    cy.createCategory('TransportOld').then((cat) => {
      cy.visit('/categories');
      cy.contains('.list-item-name', 'TransportOld').should('be.visible');

      // Click edit
      cy.get(`[aria-label="Edit category TransportOld"]`).click();
      cy.get('h1').should('contain', 'Edit Category');

      // Change the name
      cy.get('#category-name').clear().type('TransportNew');
      cy.contains('button', 'Update Category').click();

      // Should redirect and show updated name
      cy.url().should('include', '/categories');
      cy.url().should('not.include', '/edit');
      cy.contains('.list-item-name', 'TransportNew').should('be.visible');
      cy.contains('.list-item-name', 'TransportOld').should('not.exist');
    });
  });

  it('should delete a category', () => {
    cy.createCategory('ToDelete');
    cy.visit('/categories');
    cy.contains('.list-item-name', 'ToDelete').should('be.visible');

    // Stub confirm to auto-accept
    cy.on('window:confirm', () => true);

    cy.get(`[aria-label="Delete category ToDelete"]`).click();

    // Should disappear from the list
    cy.contains('.list-item-name', 'ToDelete').should('not.exist');
    cy.contains('No categories yet').should('be.visible');
  });

  it('should reject duplicate category name', () => {
    cy.createCategory('Duplicate');
    cy.visit('/categories/new');

    cy.get('#category-name').type('Duplicate');
    cy.contains('button', 'Save Category').click();

    // Should show error (stays on form)
    cy.get('[role="alert"]').should('be.visible');
    cy.url().should('include', '/categories/new');
  });
});
