import { test, expect } from '@playwright/test';
import { WorkflowPage, LoginPage } from '../pages';
import { mockAllAiServices } from '../mocks';

test.describe('Workflow Builder Tests', () => {
  let workflowPage: WorkflowPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    workflowPage = new WorkflowPage(page);
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await mockAllAiServices(page);
  });

  test('new workflow can be created', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Test Workflow', 'A test workflow description');
    await workflowPage.expectWorkflowExists('Test Workflow');
  });

  test('node can be added to workflow', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Node Test Workflow');
    await workflowPage.addNode('action', 300, 300);
    await workflowPage.expectNodeCount(1);
  });

  test('nodes can be connected', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Connection Test Workflow');
    await workflowPage.addNode('trigger', 200, 200);
    await workflowPage.addNode('action', 500, 200);
    const nodes = await workflowPage.nodes.all();
    if (nodes.length >= 2) {
      await workflowPage.connectNodes(await nodes[0].getAttribute('data-id') || '', await nodes[1].getAttribute('data-id') || '');
    }
    await expect(workflowPage.connections.first()).toBeVisible();
  });

  test('drag and drop nodes on canvas', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Drag Drop Workflow');
    await workflowPage.dragNode('action', 400, 400);
    await workflowPage.expectNodeCount(1);
  });

  test('workflow can be saved', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Save Test Workflow');
    await workflowPage.saveWorkflow();
    await workflowPage.expectWorkflowExists('Save Test Workflow');
  });

  test('workflow can be duplicated', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Duplicate Test Workflow');
    await workflowPage.duplicateWorkflow('Duplicate Test Workflow');
    await workflowPage.expectWorkflowExists('Duplicate Test Workflow (copy)');
  });

  test('workflow execution works', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Execute Test Workflow');
    await workflowPage.addNode('trigger', 200, 200);
    await workflowPage.addNode('action', 500, 200);
    await workflowPage.executeWorkflow();
    await workflowPage.waitForExecutionComplete();
    await workflowPage.expectExecutionSuccess();
  });

  test('execution logs are displayed', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Logs Test Workflow');
    await workflowPage.addNode('trigger', 200, 200);
    await workflowPage.addNode('action', 500, 200);
    await workflowPage.executeWorkflow();
    await workflowPage.waitForExecutionComplete();
    await expect(workflowPage.executionLogs).toBeVisible();
  });

  test('workflow can be deleted', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Delete Test Workflow');
    await workflowPage.deleteWorkflow('Delete Test Workflow');
    await expect(workflowPage.workflowItems.filter({ hasText: 'Delete Test Workflow' }).first()).toBeHidden();
  });

  test('node configuration panel works', async () => {
    await workflowPage.open();
    await workflowPage.createWorkflow('Config Test Workflow');
    await workflowPage.addNode('ai-model', 300, 300);
    const nodes = await workflowPage.nodes.all();
    if (nodes.length > 0) {
      const nodeId = await nodes[0].getAttribute('data-id');
      if (nodeId) {
        await workflowPage.configureNode(nodeId, { model: 'gpt-4', temperature: '0.7' });
      }
    }
  });
});