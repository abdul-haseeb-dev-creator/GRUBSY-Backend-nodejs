import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Grubsy Platform API',
      version: '1.0.0',
      description: 'Backend API for Grubsy Food Delivery Platform',
      contact: {
        name: 'Grubsy Platform',
        email: 'support@grubsy.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3002',
        description: 'Development server'
      },
      {
        url: 'https://4a4ab8731fca.ngrok-free.app',
        description: 'Ngrok tunnel (temporary)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        driverAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-driver-id'
        }
      },
      schemas: {
        Order: {
          type: 'object',
          required: ['orderId', 'status', 'deliveryAddress'],
          properties: {
            orderId: {
              type: 'string',
              description: 'Unique order identifier',
              example: 'GDS-TEST-123456'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'ACCEPTED', 'READY_FOR_DRIVER', 'ALLOCATING_DRIVER', 'ALLOCATED_DRIVER', 'AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
              description: 'Current order status',
              example: 'READY_FOR_DRIVER'
            },
            deliveryAddress: {
              type: 'string',
              description: 'Delivery address for the order',
              example: '45 Windsor Road, SL1 4DX'
            },
            deliveryFee: {
              type: 'string',
              description: 'Delivery fee amount',
              example: '£3.50'
            },
            orderGrandTotal: {
              type: 'string',
              description: 'Total order amount',
              example: '17.25'
            },
            partnerId: {
              type: 'string',
              description: 'Merchant/Partner ID',
              example: 'Grb-0001'
            },
            deliveryInstructions: {
              type: 'string',
              description: 'Special delivery instructions',
              example: 'Ring doorbell twice. Leave by front door if no answer.'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp'
            },
            driverId: {
              type: 'string',
              description: 'Assigned driver ID',
              example: 'driver123'
            }
          }
        },
        Merchant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Merchant unique identifier'
            },
            Grubsy_Partner_ID: {
              type: 'string',
              description: 'Grubsy partner ID',
              example: 'Grb-0001'
            },
            Merchants_Name: {
              type: 'string',
              description: 'Merchant name',
              example: 'La Damas'
            },
            Description: {
              type: 'string',
              description: 'Merchant description'
            },
            Cuisine: {
              type: 'string',
              description: 'Type of cuisine',
              example: 'Mediterranean'
            },
            Address: {
              type: 'string',
              description: 'Merchant address',
              example: '277a High Street, Slough, Berkshire, SL1 1BN'
            },
            PostCode: {
              type: 'string',
              description: 'Postal code',
              example: 'SL1'
            },
            Active: {
              type: 'string',
              description: 'Whether merchant is active',
              example: 'Yes'
            }
          }
        },
        Driver: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Driver unique identifier'
            },
            name: {
              type: 'string',
              description: 'Driver name',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Driver email',
              example: 'driver@example.com'
            },
            phone: {
              type: 'string',
              description: 'Driver phone number',
              example: '+44 7123 456789'
            },
            isAvailable: {
              type: 'boolean',
              description: 'Whether driver is currently available'
            },
            vehicle: {
              type: 'string',
              description: 'Vehicle information',
              example: 'Black Honda Civic - GR23 XYZ'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            error: {
              type: 'string',
              description: 'Error message if request failed'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Merchants',
        description: 'Merchant/Restaurant management'
      },
      {
        name: 'Drivers',
        description: 'Driver management and operations'
      },
      {
        name: 'Authentication',
        description: 'Authentication endpoints'
      },
      {
        name: 'Health',
        description: 'System health and monitoring'
      }
    ]
  },
  apis: [
    './src/api.js',
    './src/drivers.js',
    './src/auth.js',
    './routes/*.js'
  ]
};

const specs = swaggerJSDoc(options);

export { specs, swaggerUi };
