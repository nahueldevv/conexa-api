import { z } from 'zod'

export const createProposalSchema = z.object({
  message: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().default('USD'),
  documents: z.array(z.object({
    document_type_id: z.string().uuid(),
    url: z.string()
  })).optional()
})

export const updateProposalSchema = z.object({
  message: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  documents: z.array(z.object({
    document_type_id: z.string().uuid(),
    url: z.string()
  })).optional()
})
