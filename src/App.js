import logo from './logo.svg';
import './App.css';
import * as faceapi from "face-api.js";
import React, { useEffect, useRef, useState } from 'react';

function App() {
    const videoRef = useRef(null);
    const [nombre, setNombre] = useState('');
    const [descriptors, setDescriptors] = useState([]);
    const [accesoString, setAccesoString] = useState("");
    let labeledFaceDescriptors = [];

    const getVideo = async () => {
        if (navigator.mediaDevices.getUserMedia) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
            }
        } else {
            console.error('getUserMedia is not supported by your browser.');
        }
    };

    const loadModels = async () => {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    };

    const loadDescriptors = async () => {
        const response = await fetch('http://localhost:5000/getCaras');
        const data = await response.json();
        console.log(data)
        return data.map((persona)=> {
                const mydescriptors = persona.descriptors.map(
                    (d)=>new Float32Array(d.split(","))
                )
            console.log(mydescriptors)
                return new faceapi.LabeledFaceDescriptors(persona.name, mydescriptors);
            }
        )
    };

    useEffect(() => {
        const initialize = async () => {
            await loadModels();
            await getVideo();

            if (videoRef.current) {
                videoRef.current.addEventListener('playing', async () => {
                    const nuevocanvas = faceapi.createCanvasFromMedia(videoRef.current);
                    document.body.append(nuevocanvas);
                    document.getElementById("canvas").innerHTML = '';
                    document.getElementById("canvas").append(nuevocanvas);

                    const displaySize = {
                        width: videoRef.current.videoWidth,
                        height: videoRef.current.videoHeight
                    };

                    faceapi.matchDimensions(nuevocanvas, displaySize);

                    setInterval(async () => {

                        try{
                            labeledFaceDescriptors = await loadDescriptors();
                        } catch (e) {
                            console.log(e)
                            labeledFaceDescriptors = []
                        }

                        console.log('lbf: ', labeledFaceDescriptors)
                        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
                        nuevocanvas.getContext('2d').clearRect(0, 0, nuevocanvas.width, nuevocanvas.height);
                        try{
                            setDescriptors(detections.map((e)=>e.descriptor))
                        } catch (e) {
                            setDescriptors([]);
                        }

                        faceapi.draw.drawDetections(nuevocanvas, detections);
                        faceapi.draw.drawFaceLandmarks(nuevocanvas, detections);
                        if (labeledFaceDescriptors.length>0 && detections.length>0){
                            const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.4);
                            let acceso = false;
                            detections.forEach(detection => {
                                const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                                const box = detection.detection.box;
                                const drawBox = new faceapi.draw.DrawBox(box, { label: bestMatch.toString() });
                                console.log(bestMatch.label)
                                if (bestMatch.label!=='unknown') acceso = true
                                drawBox.draw(nuevocanvas);
                            });
                            setAccesoString((acceso)?'Acceso permitido': 'Acceso denegado')

                        } else{
                            setAccesoString("")
                        }
                    }, 2000);
                });
            }
        };

        initialize();
    }, []);


    const guardarCara = async () => {
        if (nombre==='') return alert("Falta ingresar nombre")
        if (descriptors.length!==1) alert("No se detecta exactamente una cara")
        const body = {
                'name': nombre,
                'descriptors': descriptors.map((d)=>d.toString())
        };
        const response = await fetch("http://localhost:5000/agregarCara", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body), // body data type must match "Content-Type" header
        });
        console.log(response);

        // request.headers['Content-Length'] = Buffer.byteLength(request.body).toString();

    }

    return (
        <div className="cont">
            <div id="video">
                <video id="camara" width="640" height="480" ref={videoRef} autoPlay muted></video>
                <div id="canvas"></div>
                {(descriptors.length===1)?
                    <>
                        <label>
                            Nombre:
                            <input
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                            />
                        </label>
                        <button onClick={()=>guardarCara()}>Agregar Cara</button>
                    </>
                    :null}
            </div>
            {accesoString}
        </div>
    );
}

export default App;
