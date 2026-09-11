import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkflowPage extends BasePage {
  readonly newWorkflowButton: Locator;
  readonly workflowNameInput: Locator;
  readonly workflowDescriptionInput: Locator;
  readonly saveButton: Locator;
  readonly canvas: Locator;
  readonly nodePalette: Locator;
  readonly nodes: Locator;
  readonly connections: Locator;
  readonly executeButton: Locator;
  readonly executionLogs: Locator;
  readonly deleteWorkflowButton: Locator;
  readonly duplicateWorkflowButton: Locator;
  readonly workflowList: Locator;
  readonly workflowItems: Locator;
  readonly nodeMenu: Locator;
  readonly settingsPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.newWorkflowButton = page.getByTestId('new-workflow-button').or(page.getByRole('button', { name: /new workflow|create workflow/i }));
    this.workflowNameInput = page.getByTestId('workflow-name').or(page.locator('input[name*="name" i], input[placeholder*="name" i]'));
    this.workflowDescriptionInput = page.getByTestId('workflow-description').or(page.locator('textarea[name*="description" i]'));
    this.saveButton = page.getByTestId('save-workflow').or(page.getByRole('button', { name: /save/i }));
    this.canvas = page.getByTestId('workflow-canvas').or(page.locator('[data-testid="canvas"], .workflow-canvas, .react-flow'));
    this.nodePalette = page.getByTestId('node-palette').or(page.locator('[data-testid="palette"], .node-palette'));
    this.nodes = page.getByTestId('workflow-node').or(page.locator('[data-testid="node"], .react-flow__node'));
    this.connections = page.getByTestId('connection').or(page.locator('.react-flow__edge, .connection'));
    this.executeButton = page.getByTestId('execute-workflow').or(page.getByRole('button', { name: /execute|run/i }));
    this.executionLogs = page.getByTestId('execution-logs').or(page.locator('[data-testid="logs"], .execution-logs'));
    this.deleteWorkflowButton = page.getByTestId('delete-workflow').or(page.locator('button[aria-label*="delete workflow" i]'));
    this.duplicateWorkflowButton = page.getByTestId('duplicate-workflow').or(page.locator('button[aria-label*="duplicate" i]'));
    this.workflowList = page.getByTestId('workflow-list').or(page.locator('[data-testid="workflow-list"], .workflow-list'));
    this.workflowItems = page.getByTestId('workflow-item').or(page.locator('[data-testid="workflow-item"], .workflow-item'));
    this.nodeMenu = page.getByTestId('node-menu').or(page.locator('[data-testid="node-menu"], .node-context-menu'));
    this.settingsPanel = page.getByTestId('settings-panel').or(page.locator('[data-testid="settings"], .node-settings'));
  }

  async open(): Promise<void> {
    await this.goto('/workflows');
    await this.waitForLoadState();
  }

  async createWorkflow(name: string, description?: string): Promise<void> {
    await this.newWorkflowButton.click();
    await this.workflowNameInput.fill(name);
    if (description) {
      await this.workflowDescriptionInput.fill(description);
    }
    await this.saveButton.click();
    await this.waitForLoadState();
  }

  async addNode(nodeType: string, x: number, y: number): Promise<void> {
    const nodeButton = this.nodePalette.getByRole('button', { name: new RegExp(nodeType, 'i') });
    await nodeButton.dragTo(this.canvas, { targetPosition: { x, y } });
  }

  async connectNodes(sourceNodeId: string, targetNodeId: string): Promise<void> {
    const sourceNode = this.nodes.filter({ has: this.page.locator(`[data-id="${sourceNodeId}"]`) }).first();
    const targetNode = this.nodes.filter({ has: this.page.locator(`[data-id="${targetNodeId}"]`) }).first();
    const sourceHandle = sourceNode.locator('.react-flow__handle-output, [data-testid="output-handle"]').first();
    await sourceHandle.dragTo(targetNode);
  }

  async saveWorkflow(): Promise<void> {
    await this.saveButton.click();
    await this.waitForLoadState();
  }

  async executeWorkflow(): Promise<void> {
    await this.executeButton.click();
    await this.executionLogs.waitFor({ state: 'visible', timeout: 5000 });
  }

  async waitForExecutionComplete(): Promise<void> {
    await this.executionLogs.locator('.completed, .success, [data-status="completed"]').waitFor({ timeout: 120000 });
  }

  async openWorkflow(name: string): Promise<void> {
    const workflow = this.workflowItems.filter({ hasText: name }).first();
    await workflow.click();
    await this.waitForLoadState();
  }

  async duplicateWorkflow(name: string): Promise<void> {
    await this.openWorkflow(name);
    await this.duplicateWorkflowButton.click();
    await this.waitForLoadState();
  }

  async deleteWorkflow(name: string): Promise<void> {
    await this.openWorkflow(name);
    await this.deleteWorkflowButton.click();
    await this.page.getByRole('button', { name: /confirm|delete/i }).click();
    await this.waitForLoadState();
  }

  async dragNode(nodeType: string, x: number, y: number): Promise<void> {
    const nodeButton = this.nodePalette.getByRole('button', { name: new RegExp(nodeType, 'i') });
    await nodeButton.dragTo(this.canvas, { targetPosition: { x, y } });
  }

  async configureNode(nodeId: string, config: Record<string, string>): Promise<void> {
    const node = this.nodes.filter({ has: this.page.locator(`[data-id="${nodeId}"]`) }).first();
    await node.click({ button: 'right' });
    await this.settingsPanel.waitFor({ state: 'visible' });
    for (const [key, value] of Object.entries(config)) {
      const input = this.settingsPanel.locator(`input[name="${key}"], select[name="${key}"], textarea[name="${key}"]`).first();
      if (await input.isVisible()) {
        if (await input.evaluate(el => el.tagName) === 'SELECT') {
          await input.selectOption(value);
        } else {
          await input.fill(value);
        }
      }
    }
    await this.page.click('body'); // Close panel
  }

  async expectWorkflowExists(name: string): Promise<void> {
    await expect(this.workflowItems.filter({ hasText: name }).first()).toBeVisible();
  }

  async expectNodeCount(count: number): Promise<void> {
    await expect(this.nodes).toHaveCount(count);
  }

  async expectExecutionSuccess(): Promise<void> {
    await expect(this.executionLogs.locator('.success, [data-status="success"]')).toBeVisible();
  }
}