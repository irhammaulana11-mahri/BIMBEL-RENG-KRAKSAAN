import { Helmet,HelmetProvider, } from "react-helmet-async";

const PageMeta = ({title,description,}) => {
  return (
    <Helmet>
      <title>{title}</title>

      <meta name="description" content={description}/>
    </Helmet>
  );
};

export const AppWrapper = ({children,}) => {
  return (
    <HelmetProvider>
      {children}
    </HelmetProvider>
  );
};

export default PageMeta;