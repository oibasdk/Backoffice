import { queryAI } from '../ai';
import * as client from '../../api/client';

vi.mock('../../api/client');

describe('api/ai', () => {
  it('queryAI forwards request and returns results', async () => {
    // @ts-ignore
    client.request.mockResolvedValue({ results: [{ title: 'x', route: '/x' }] });
    const res = await queryAI('test');
    expect(res).toHaveProperty('results');
    expect(res.results[0].route).toBe('/x');
  });
});
