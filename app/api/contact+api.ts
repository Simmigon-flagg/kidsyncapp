interface Contact {
  name: string;
  _id: string;
}

export const GET = (): Response => {
  const contact: Contact = 
    { name: "Single", _id: "asdfl[" }
  ;
  return Response.json({ message: "All contacts", contact });
};

export const POST = async (request: Request): Promise<Response> => {
  const _id = new URL(request.url).searchParams.get("_id")
  console.log(_id)
  // const contacts: Contact[] = [contact];
  return Response.json({ message: "Received a contact", _id });
};

export const PUT = async (request: Request): Promise<Response> => {
  const contacts: Contact[] = await request.json();
  return Response.json({ message: "Updated a contact", contacts });
};

export const DELETE = (): Response => {
  return Response.json({ message: "Resource contact deleted" });
};
