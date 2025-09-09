
import React from "react";
import { Box, Typography } from "@mui/material";

function Contact() {
    return (
        <>
   <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "20px",
                    flexWrap: "nowrap", // Prevent wrapping
                    marginTop: "70px"
                }}
            >
                {/* Map Section */}
                <Box sx={{ width: "50%", minWidth: "50%", padding: "10px",height:"100%"}}>
                    <Box
                        className="mapouter"
                        sx={{ position: "relative", textAlign: "right", height: "350px", width: "100%" }}
                    >
                        <Box
                            className="gmap_canvas"
                            sx={{ overflow: "hidden", background: "none!important", height: "600px", width: "100%" }}
                        >
                            <iframe
                                width="100%"
                                height="100%"
                                id="gmap_canvas"
                                src="https://maps.google.com/maps?q=Icahn%20school%20of%20medicine&t=&z=13&ie=UTF8&iwloc=&output=embed"
                            ></iframe>
                        </Box>
                    </Box>

                    {/* Contact Details */}
                    <Typography sx={{ marginTop: "350px", fontSize: "17px", fontFamily: "Roboto", color: "black" }}>
                        Gümüş Lab ©
                        <br />
                        <a href="http://gumuslab.github.io" target="_blank" rel="noopener noreferrer">
                            gumuslab.github.io
                        </a>
                        <br />
                        1 Gustave L Levy Place, Box 1498 <br />
                        New York, NY 10029-6574
                        <br />
                        Email: <a href="mailto:zeynep.gumus@mssm.edu">zeynep.gumus@mssm.edu</a>
                    </Typography>
                </Box>

                {/* Google Form Section */}
                <Box sx={{ width: "50%", minWidth: "50%", padding: "10px" }}>
                    <iframe
                        src="https://docs.google.com/forms/d/e/1FAIpQLScRsWhYEosmgx-exbuvwtoJSNe-uKQn91aW-oeSdqrpkkzVjg/viewform?embedded=true"
                        width="100%"
                        height="800px" // ✅ Fixed height to show the full form
                        style={{ border: "none" }}
                    >
                        Loading…
                    </iframe>
                </Box>
            </Box>
    </>
    );
};
 
export default Contact;