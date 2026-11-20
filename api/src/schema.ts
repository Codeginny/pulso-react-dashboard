export const typeDefs = /* GraphQL */ `#graphql
  """
  Ventana de tiempo del análisis. Los datos van de diciembre de 2009 a noviembre de 2011.
  """
  enum Periodo {
    ULTIMOS_3_MESES
    ULTIMOS_6_MESES
    ULTIMOS_12_MESES
    TODO
  }

  enum Region {
    TODAS
    REINO_UNIDO
    INTERNACIONAL
  }

  enum FormatoKpi {
    MONEDA
    ENTERO
    PORCENTAJE
  }

  enum OrdenClientes {
    INGRESOS_DESC
    RECENCIA_ASC
    FRECUENCIA_DESC
  }

  input Filtros {
    periodo: Periodo! = ULTIMOS_12_MESES
    region: Region! = TODAS
  }

  type PeriodoInfo {
    periodo: Periodo!
    etiqueta: String!
    desde: String!
    hasta: String!
    "Etiqueta del período contra el que se comparan los KPIs. Nulo si no hay comparación."
    comparaCon: String
  }

  type Kpi {
    clave: ID!
    etiqueta: String!
    valor: Float!
    anterior: Float
    "Variación relativa contra el período anterior (0.12 = +12 %)."
    variacion: Float
    formato: FormatoKpi!
    "Si es falso, que el valor suba es una mala noticia (por ejemplo, devoluciones)."
    mejorSiSube: Boolean!
  }

  type PuntoMensual {
    mes: String!
    ingresos: Float!
    pedidos: Int!
    clientes: Int!
    clientesNuevos: Int!
  }

  type Resumen {
    periodo: PeriodoInfo!
    kpis: [Kpi!]!
    serie: [PuntoMensual!]!
  }

  type Segmento {
    nombre: String!
    orden: Int!
    descripcion: String!
    accion: String!
    clientes: Int!
    ingresos: Float!
    participacionIngresos: Float!
    recenciaPromedio: Float!
    frecuenciaPromedio: Float!
    ticketPromedio: Float!
  }

  type Cliente {
    id: ID!
    pais: String!
    segmento: String!
    "Días desde la última compra al 01/12/2011."
    recencia: Int!
    frecuencia: Int!
    monetario: Float!
    ticketPromedio: Float!
    primeraCompra: String!
    ultimaCompra: String!
    "Puntajes R, F y M de 1 a 4, por ejemplo 443."
    puntajeRfm: String!
  }

  type PaginaClientes {
    items: [Cliente!]!
    total: Int!
    pagina: Int!
    porPagina: Int!
  }

  type Cohorte {
    "Mes de la primera compra."
    mes: String!
    clientes: Int!
    "Porcentaje de la cohorte que volvió a comprar en el mes 0, 1, 2…"
    retencion: [Float!]!
  }

  type Producto {
    codigo: ID!
    descripcion: String!
    ingresos: Float!
    unidades: Int!
    clientes: Int!
  }

  type Pais {
    nombre: String!
    ingresos: Float!
    clientes: Int!
    pedidos: Int!
  }

  type PuntoPareto {
    clientes: Float!
    ingresos: Float!
  }

  type Pareto {
    "Porcentaje de los ingresos que genera el 20 % de los clientes que más compran."
    top20: Float!
    curva: [PuntoPareto!]!
  }

  type TablaAsistente {
    columnas: [String!]!
    filas: [[String!]!]!
  }

  type RespuestaAsistente {
    texto: String!
    "Qué consulta se usó para responder, para que la respuesta sea verificable."
    consulta: String!
    tabla: TablaAsistente
    sugerencias: [String!]!
  }

  type Query {
    periodos: [PeriodoInfo!]!
    resumen(filtros: Filtros): Resumen!
    segmentos(region: Region = TODAS): [Segmento!]!
    clientes(
      region: Region = TODAS
      segmento: String
      busqueda: String
      orden: OrdenClientes = INGRESOS_DESC
      pagina: Int = 1
      porPagina: Int = 10
    ): PaginaClientes!
    cohortes(region: Region = TODAS, desde: String = "2010-12", limite: Int = 12): [Cohorte!]!
    productos(filtros: Filtros, limite: Int = 10): [Producto!]!
    paises(filtros: Filtros, limite: Int = 10): [Pais!]!
    pareto(region: Region = TODAS): Pareto!
    "Asistente de datos: responde preguntas frecuentes en lenguaje natural con reglas y consultas fijas."
    preguntar(pregunta: String!, filtros: Filtros): RespuestaAsistente!
  }
`;
