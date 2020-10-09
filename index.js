/*****************************************************************************/
/* DEPENDENCIAS                                                              */
/*****************************************************************************/
const axios = require('axios');
const qs = require('qs');
const converter = require('json-2-csv');
const fs = require('fs');


/*****************************************************************************/
/* CONSTANTES                                                                */
/*****************************************************************************/
//URL consulta localidades
const url = 'https://www.correoargentino.com.ar/sites/all/modules/custom/ca_forms/api/wsFacade.php';

//archivo de salida
const filename = 'localidades.csv';

//segun ISO 3166-2:AR
const provincias = {
    A: 'Salta',
    B: 'Provincia de Buenos Aires',
    C: 'Ciudad Autónoma de Buenos Aires',
    D: 'San Luis',
    E: 'Entre Ríos',
    F: 'La Rioja',
    G: 'Santiago del Estero',
    H: 'Chaco',
    J: 'San Juan',
    K: 'Catamarca',
    L: 'La Pampa',
    M: 'Mendoza',
    N: 'Misiones',
    P: 'Formosa',
    Q: 'Neuquén',
    R: 'Río Negro',
    S: 'Santa Fe',
    T: 'Tucumán',
    U: 'Chubut',
    V: 'Tierra del Fuego',
    W: 'Corrientes',
    X: 'Córdoba',
    Y: 'Jujuy',
    Z: 'Santa Cruz'
};


/*****************************************************************************/
/* FUNCIONES                                                                 */
/*****************************************************************************/

//Obtiene el JSON con localidades segun el codigo de provincia
const getLocalidadesPorCodigoProvincia = (url, codigoProvincia) => {

    //armo el body
    var data = qs.stringify({
        'action': 'localidades',
        'altura': '',
        'calle': '',
        'localidad': 'none',
        'provincia': codigoProvincia 
    });

    //configuro la request
    var config = {
      method: 'post',
      url,
      headers: { 
        'Accept': 'application/json, text/javascript, */*; q=0.01', 
        'X-Requested-With': 'XMLHttpRequest', 
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36', 
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 
        'Sec-Fetch-Site': 'same-origin', 
        'Sec-Fetch-Mode': 'cors'
      },
      data : data
    };
    
    //ejecuto y retorno
    return axios(config)
        .then(response => response.data);
}

//mapea una localidad. devuelve los datos de la localidad pero agrega el nombre y codigo de provincia
const mapLocalidad = (localidad, codigoProvincia) => {
    return { 
        ...localidad, 
        codigoProvincia, 
        nombreProvincia: provincias[codigoProvincia]
    };
}

//devuelve lista de localidades
const getLocalidades = async (url) => {
    //obtengo las localidades de cada provincia
    var localidades = [];
    for(const codigoProvincia in provincias) {
        console.log(`Obteniendo localidades de ${provincias[codigoProvincia]}...`);

        //obtengo las localidades de la provincia actual
        const localidadesProvinciaActual = await getLocalidadesPorCodigoProvincia(url, codigoProvincia);

        //mapeo las localidades
        const localidadesMapeadas = localidadesProvinciaActual
            .map(localidad => mapLocalidad(localidad, codigoProvincia));

        //las agrego a la lista de localidades
        localidades = [...localidades, ...localidadesMapeadas];
    }
    return localidades;
}

//guarda lista de localidades con csv
const saveAsCsv = (localidades, filename) => {
    return new Promise((resolve, reject) => {
        converter.json2csv(localidades, (error, csv) => {

            //si falla conversion a csv rechazo promesa
            if (error) {
                reject(error);
            }

            try {
                //escribo archivo y resuelvo promesa correctamente
                fs.writeFileSync(filename, csv);
                resolve();
            } catch(e) {
                //si falla el guardado del archivo rechazo
                reject(e);
            }
        });
    });
}


/*****************************************************************************/
/* PROGRAMA                                                                  */
/*****************************************************************************/
(async (url, filename) => {
    try {
        //obtengo las localidades
        const localidades = await getLocalidades(url);

        //guardo como csv
        console.log('Generando archivo...');
        await saveAsCsv(localidades, filename);
        console.log(`Se genero el archivo ${filename}`);
    } catch(e) {
        console.log('Error!', e);
    }

})(url, filename);