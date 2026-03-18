import client from '../client';

const getSection = (section) => client.get(`/admin/cms/${section}`);
const updateSection = (section, body) => client.put(`/admin/cms/${section}`, body);

export default { getSection, updateSection };
