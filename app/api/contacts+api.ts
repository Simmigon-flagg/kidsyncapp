interface Contact {
  name: string;
  _id: string;
}

export const GET = (): Response => {
  const contacts: Contact[] = [
     { name: "Simmigon", _id: "asdfl2[p4dflv[" },
    { name: "Flagg", _id: "asdfl2[" }
  ];
  return Response.json({ message: "All contacts", contacts });
};

export const POST = async (request: Request): Promise<Response> => {
  const contact: Contact = await request.json();
  const contacts: Contact[] = [contact];
  return Response.json({ message: "Received a contact", contacts });
};

export const PUT = async (request: Request): Promise<Response> => {
  const contacts: Contact[] = await request.json();
  return Response.json({ message: "Updated a contact", contacts });
};

export const DELETE = (): Response => {
  return Response.json({ message: "Resource contact deleted" });
};
