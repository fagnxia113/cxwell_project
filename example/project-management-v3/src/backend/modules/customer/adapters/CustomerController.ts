import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { CustomerUseCase } from '../application/CustomerUseCase.js';

function getCustomerUseCase(): CustomerUseCase {
  return container.resolve(CustomerUseCase);
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, type, page, pageSize } = req.query;
    const result = await getCustomerUseCase().getCustomers({
      search: search as string,
      type: type as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await getCustomerUseCase().getCustomerById(req.params.id as string);
    if (!customer) return res.status(404).json({ error: '客户不存在' });
    res.json({ success: true, data: customer.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const customer = await getCustomerUseCase().createCustomer(req.body);
    res.status(201).json({ success: true, data: customer.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await getCustomerUseCase().updateCustomer(req.params.id as string, req.body);
    res.json({ success: true, data: customer.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await getCustomerUseCase().deleteCustomer(req.params.id as string);
    res.json({ success: true, message: '客户删除成功' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
