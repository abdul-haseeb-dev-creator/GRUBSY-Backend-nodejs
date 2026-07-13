module.exports = {
  getData: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      status: 200,
      data: [{ id: 1, name: 'Mock Restaurant' }], // Match expected structure
    });
  }),
  
  createEstablishment: jest.fn().mockResolvedValue({
    success: true,
    id: 'test-establishment-id',
  }),

  updateEstablishment: jest.fn().mockResolvedValue({ success: true }),
  
  getEstablishments: jest.fn().mockResolvedValue([]),
  
  addEstablishment: jest.fn().mockResolvedValue({ success: true }),
};