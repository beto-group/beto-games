import ClientHome from './client_page';

export const runtime = 'edge';


export default function Page({ params }) {
    return <ClientHome params={params} />;
}
