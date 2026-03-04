const mockUserService = {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
    update: jest.fn().mockResolvedValue({ id: 1, name: 'Updated User' }),
    delete: jest.fn().mockResolvedValue(true),
};

export default mockUserService;