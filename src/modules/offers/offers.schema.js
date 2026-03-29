import { z } from 'zod'

export const createOfferSchema = z.object({
  origin: z.string().min(2, 'Origen requerido'),
  origin_lat: z.number().optional(),
  origin_lng: z.number().optional(),

  destination: z.string().min(2, 'Destino requerido'),
  dest_lat: z.number().optional(),
  dest_lng: z.number().optional(),

  cargo_type: z.enum(['general', 'refrigerated', 'hazardous', 'bulk', 'livestock']),
  weight_kg: z.number().positive('El peso debe ser mayor a 0'),
  volume_m3: z.number().positive().optional(),

  vehicle_type: z.enum(['van', 'truck', 'semi', 'flatbed', 'tanker', 'refrigerated_truck']),
  temperature_control: z.string().optional(),
  number_of_vehicles: z.number().int().positive().default(1),

  available_date: z.string().refine(d => !isNaN(Date.parse(d)), {
    message: 'Fecha inválida'
  }),

  price: z.number().positive().optional(),
  currency: z.string().default('USD'),
  
  required_document_ids: z.array(z.string().uuid()).optional()
})

export const updateOfferSchema = createOfferSchema.partial()