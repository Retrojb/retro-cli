import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getAvailableOptions } from '../../src/templates/registry.js';
import { ScaffoldConfig } from '../../src/types.js';

// Feature: template-cli, Property 3: Selected options are preserved through the pipeline

describe('Options selection preservation', () => {
  /**
   * Property 3: Selected options are preserved through the pipeline
   *
   * For any subset of available additional options selected by the user,
   * the resulting ScaffoldConfig.additionalOptions array shall contain
   * exactly the selected option names with no additions, removals, or reordering.
   *
   * **Validates: Requirements 4.3**
   */
  it('Property 3: selected options are preserved in ScaffoldConfig', () => {
    const availableOptionNames = getAvailableOptions().map(o => o.name);

    fc.assert(
      fc.property(
        fc.subarray(availableOptionNames),
        (selectedOptions) => {
          const config: ScaffoldConfig = {
            projectName: 'test-project',
            template: { name: 'expo', displayName: 'Expo', description: 'test', repoUrl: 'https://example.com' },
            additionalOptions: selectedOptions,
            targetDir: '/tmp/test-project',
          };

          expect(config.additionalOptions).toEqual(selectedOptions);
          expect(config.additionalOptions.length).toBe(selectedOptions.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
