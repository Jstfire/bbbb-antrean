import { redirect } from "next/navigation";

interface PreloadPageParams {
    params: {
        uuid: string;
    };
}

export default function PreloadPage({ params }: PreloadPageParams) {
    // This page will redirect to the preload page which will then redirect to the actual form
    redirect(`/visitor-form/preload?uuid=${params.uuid}`);
}
